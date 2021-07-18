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
        this.requireCache = require.cache;
    }
    HMR.prototype.getCacheByModuleId = function (moduleId) {
        return this.requireCache[moduleId];
    };
    HMR.prototype.deleteModuleFromCache = function (moduleId) {
        delete this.requireCache[moduleId];
    };
    HMR.prototype.reloadModule = function (moduleId, count) {
        try {
            console.log('Reload module try = ' + count);
            var m = require(moduleId);
            console.log(m);
        }
        catch (ex) {
            console.log('Exception thrown');
            console.log(ex);
        }
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
            //this.reloadModule(moduleId, 1);
            try {
                // Reload module
                require(moduleId);
                console.log(require.cache[moduleId]);
            }
            catch (ex) {
                console.log('F some body');
                console.error(ex);
            }
            // if (this.getCacheByModuleId(moduleId).children.length === 0) {
            //     console.error('Falt');
            //     console.error(this.getCacheByModuleId(moduleId));
            // }
            this.getCacheByModuleId(moduleId).children.forEach(function (child) {
                dependencies.push(child.id);
            });
        }
        return dependencies;
    };
    HMR.prototype.setupWatcher = function () {
        return chokidar_1["default"].watch(['**/*.js'], {
            ignoreInitial: true,
            ignored: [
                '.git',
                'node_modules'
            ]
        });
    };
    HMR.prototype.watchTargetFile = function (target, callback) {
        var _this = this;
        var moduleId = path_1["default"].resolve(target);
        var module = this.getCacheByModuleId(moduleId);
        this.targetId = moduleId;
        this.callback = callback;
        if (module) {
            this.dependencies = new Set();
            this.requireCache[moduleId].children.forEach(function (child) {
                _this.dependencies.add(child.id);
            });
            var watcher = chokidar_1["default"].watch(['**/*.js'], {
                ignoreInitial: true,
                ignored: [
                    '.git',
                    'node_modules'
                ]
            });
            //this.setupWatcher();
            watcher.on('all', 
            // throttle(500, (event : string, file : string) => {
            //     console.log(file);
            //     this.handleFileChange(event, file);
            // })
            this.handleFileChange.bind(this));
            // watch(this.targetId, (event : string, filename : string) => {
            //     console.log('File changed ' + event + ' ' + filename);
            //     this.handleFileChange(event, filename);
            // });
        }
    };
    HMR.prototype.handleFileChange = function (event, file) {
        if (event !== 'change')
            return;
        var moduleId = path_1["default"].resolve(file);
        var module = this.getCacheByModuleId(moduleId);
        console.log(moduleId);
        if (module) {
            if (this.targetId === moduleId) {
                var dependencies = this.collectDependenciesOfModule(moduleId);
                if (dependencies.length !== 2) {
                    console.log('Number of dependencies != 2');
                    console.log(dependencies);
                    console.log(this.getCacheByModuleId(moduleId));
                    var w_1 = [];
                    this.getCacheByModuleId(moduleId).children.forEach(function (child) {
                        w_1.push(child.id);
                    });
                    console.log(w_1);
                    process_1["default"].exit(-1);
                }
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
