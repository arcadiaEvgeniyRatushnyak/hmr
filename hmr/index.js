"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var path_1 = __importDefault(require("path"));
var chokidar_1 = __importDefault(require("chokidar"));
var process_1 = __importDefault(require("process"));
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
        var dependencies = [];
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
                console.log('F some body');
                console.error(ex);
            }
            this.getCacheByModuleId(moduleId).children.forEach(function (child) {
                dependencies.push(child.id);
            });
        }
        return dependencies;
    };
    HMR.prototype.watchTargetFile = function (target, callback) {
        var _this = this;
        var moduleId = path_1["default"].resolve(target);
        var module = this.getCacheByModuleId(moduleId);
        this.targetId = moduleId;
        this.callback = callback;
        if (module) {
            this.dependencies = new Set();
            require.cache[moduleId].children.forEach(function (child) {
                _this.dependencies.add(child.id);
            });
            chokidar_1["default"].watch(['**/*.js'], {
                ignoreInitial: true,
                ignored: [
                    '.git',
                    'node_modules'
                ]
            }).on('all', this.handleFileChange.bind(this));
        }
    };
    HMR.prototype.handleFileChange = function (event, file) {
        if (event !== 'change')
            return;
        var moduleId = path_1["default"].resolve(file);
        var module = this.getCacheByModuleId(moduleId);
        if (module) {
            if (this.targetId === moduleId) {
                var dependencies = this.collectDependenciesOfModule(moduleId);
                var new_dependencies_1 = [];
                var old_dependencies_1 = this.dependencies;
                dependencies.forEach(function (dependency) {
                    if (old_dependencies_1.has(dependency)) {
                        old_dependencies_1["delete"](dependency);
                    }
                    else {
                        new_dependencies_1.push(dependency);
                    }
                });
                this.dependencies = new Set(dependencies);
                if (this.dependencies.size !== 2) {
                    process_1["default"].exit(-1);
                }
                this.callback({
                    added: new_dependencies_1,
                    modified: [],
                    deleted: Array.from(old_dependencies_1)
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
