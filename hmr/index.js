"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var path_1 = __importDefault(require("path"));
var chokidar_1 = __importDefault(require("chokidar"));
var HMR = /** @class */ (function () {
    function HMR() {
    }
    HMR.prototype.getCacheByModuleId = function (moduleId) {
        return require.cache[moduleId];
    };
    HMR.prototype.deleteModuleFromCache = function (moduleId) {
        delete require.cache[moduleId];
    };
    HMR.prototype.collectDependenciesOfModule = function (moduleId) {
        var _this = this;
        var dependencies = new Set();
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
            try {
                require(moduleId);
            }
            catch (ex) {
                console.error(ex);
            }
            this.getCacheByModuleId(moduleId).children.forEach(function (child) {
                dependencies.add(child.id);
            });
        }
        return dependencies;
    };
    HMR.prototype.watchTargetFile = function (target, callback) {
        var _this = this;
        var moduleId = path_1["default"].resolve(target);
        var module = this.getCacheByModuleId(moduleId);
        this.targetId = moduleId;
        this.dependencies = new Set();
        this.callback = callback;
        if (module) {
            this.getCacheByModuleId(moduleId).children.forEach(function (child) {
                _this.dependencies.add(child.id);
            });
            chokidar_1["default"].watch(['**/*.js'], {
                ignoreInitial: true,
                ignored: [
                    '.git',
                    'node_modules'
                ]
            }).on('change', this.handleFileChange.bind(this));
        }
    };
    HMR.prototype.handleFileChange = function (file) {
        var moduleId = path_1["default"].resolve(file);
        var module = this.getCacheByModuleId(moduleId);
        if (module) {
            if (this.targetId === moduleId) {
                var newDependencies_1 = [];
                var oldDependencies_1 = this.dependencies;
                this.dependencies = this.collectDependenciesOfModule(moduleId);
                this.dependencies.forEach(function (dependency) {
                    if (oldDependencies_1.has(dependency)) {
                        oldDependencies_1["delete"](dependency);
                    }
                    else {
                        newDependencies_1.push(dependency);
                    }
                });
                this.callback({
                    added: newDependencies_1,
                    modified: [],
                    deleted: Array.from(oldDependencies_1)
                });
            }
            else if (this.dependencies.has(moduleId)) {
                this.callback({
                    added: [],
                    modified: [module.id],
                    deleted: []
                });
            }
        }
    };
    return HMR;
}());
module.exports = function (target, callback) {
    var instance = new HMR();
    instance.watchTargetFile(target, callback);
};
