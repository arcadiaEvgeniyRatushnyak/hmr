"use strict";
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
        require(moduleId);
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
    HMR.prototype.watchTargetFile = function (target, callback) {
        var moduleId = path_1["default"].resolve(target);
        var module = this.getCacheByModuleId(moduleId);
        if (module) {
            this.targetId = moduleId;
            this.dependencies = this.collectDependenciesOfModule(moduleId);
            this.callback = callback;
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
            if (this.targetId === moduleId && this.isValidModule(moduleId)) {
                var newDependencies_1 = [];
                var oldDependencies_1 = this.dependencies;
                this.reloadModule(moduleId);
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
                    modified: [moduleId],
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
