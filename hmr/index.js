"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var path_1 = __importDefault(require("path"));
var chokidar_1 = __importDefault(require("chokidar"));
var fs_1 = __importDefault(require("fs"));
var HMR = /** @class */ (function () {
    function HMR() {
    }
    HMR.prototype.isValidModule = function (moduleId) {
        return fs_1["default"].readFileSync(moduleId).toString().trim() !== '';
    };
    HMR.prototype.getCacheByModuleId = function (moduleId) {
        return require.cache[moduleId];
    };
    HMR.prototype.deleteModuleFromCache = function (moduleId) {
        delete require.cache[moduleId];
    };
    HMR.prototype.reloadModule = function (moduleId) {
        var _this = this;
        var module = this.getCacheByModuleId(moduleId);
        if (module) {
            var modulesToReload = [module.id];
            var parentModule = module.parent;
            while (parentModule && parentModule.id !== '.') {
                modulesToReload.push(parentModule.id);
                parentModule = parentModule.parent;
            }
            modulesToReload.forEach(function (id) {
                _this.deleteModuleFromCache(id);
            });
        }
        return Promise.resolve().then(function () { return __importStar(require(moduleId)); });
    };
    HMR.prototype.collectDependenciesOfModule = function (moduleId) {
        var dependencies = new Set();
        var module = this.getCacheByModuleId(moduleId);
        if (module) {
            module.children.forEach(function (child) {
                dependencies.add(child.id);
            });
        }
        return dependencies;
    };
    HMR.prototype.watchTargetFile = function (target, callback, errorHandler) {
        var _this = this;
        var moduleId = path_1["default"].resolve(target);
        this.reloadModule(moduleId).then(function () {
            _this.targetId = moduleId;
            _this.dependencies = _this.collectDependenciesOfModule(moduleId);
            _this.callback = callback;
            _this.errorHandler = errorHandler;
            chokidar_1["default"].watch(['**/*.js'], {
                ignoreInitial: true,
                ignored: [
                    '.git',
                    'node_modules'
                ]
            }).on('change', _this.handleFileChange.bind(_this));
        })["catch"](function (err) {
            _this.errorHandler(err);
        });
    };
    HMR.prototype.handleFileChange = function (file) {
        var _this = this;
        var moduleId = path_1["default"].resolve(file);
        if (this.dependencies.has(moduleId)) {
            this.callback({
                added: [],
                modified: [moduleId],
                deleted: []
            });
        }
        else if (this.targetId === moduleId && this.isValidModule(moduleId)) {
            this.reloadModule(moduleId).then(function () {
                var newDependencies = [];
                var oldDependencies = _this.dependencies;
                _this.dependencies = _this.collectDependenciesOfModule(moduleId);
                _this.dependencies.forEach(function (dependency) {
                    if (oldDependencies.has(dependency)) {
                        oldDependencies["delete"](dependency);
                    }
                    else {
                        newDependencies.push(dependency);
                    }
                });
                _this.callback({
                    added: newDependencies,
                    modified: [],
                    deleted: Array.from(oldDependencies)
                });
            })["catch"](function (err) {
                _this.errorHandler(err);
            });
        }
    };
    return HMR;
}());
module.exports = function (target, callback, errorHandler) {
    var instance = new HMR();
    var handler = errorHandler ? errorHandler : function (err) { console.log(err); };
    instance.watchTargetFile(target, callback, handler);
};
