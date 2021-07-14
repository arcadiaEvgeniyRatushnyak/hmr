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
exports.__esModule = true;
var path_1 = __importDefault(require("path"));
var chokidar_1 = __importDefault(require("chokidar"));
var HMR = /** @class */ (function () {
    function HMR() {
        this.parentModuleName = module.parent.filename;
        this.requireCache = require.cache;
    }
    HMR.prototype.watchTargetFile = function (target, callback) {
        var moduleId = path_1["default"].resolve(target);
        var module = this.getCacheByModuleId(moduleId);
        this.targetId = moduleId;
        this.callback = callback;
        if (module) {
            this.dependencies = new Set(this.collectDependenciesOfModule(moduleId));
            var watcher = this.setupWatcher(target);
            watcher.on('all', this.handleFileChange.bind(this));
        }
    };
    HMR.prototype.init = function (target, callback) {
        // this.targetId = target;
        // this.callback = callback;
        // this.watchDir = path.dirname(target);
        //let watchDir = path.dirname(target);
        // if (options.watchDir) {
        //     watchDir = path.resolve(watchDir, options.watchDir);
        // }
        // const watcher : chokidar.FSWatcher = this.setupWatcher();
        // watcher.on('all', this.handleFileChange.bind(this));
    };
    HMR.prototype.getCacheByModuleId = function (moduleId) {
        return this.requireCache[moduleId];
    };
    HMR.prototype.reloadModule = function (moduleId) {
        delete this.requireCache[moduleId];
        return Promise.resolve().then(function () { return __importStar(require(moduleId)); });
    };
    HMR.prototype.deleteModuleFromCache = function (moduleId) {
        delete this.requireCache[moduleId];
        //require(moduleId);
    };
    HMR.prototype.collectDependenciesOfModule = function (moduleId) {
        var dependencies = [];
        var module = this.getCacheByModuleId(moduleId);
        if (module) {
            module.children.forEach(function (child) {
                dependencies.push(child.id);
            });
        }
        else {
            console.log('Fail to find: ' + moduleId);
        }
        return dependencies;
    };
    HMR.prototype.gatherDependencies = function (moduleId, onGathered) {
        var _this = this;
        delete this.requireCache[moduleId];
        // require([moduleId], (m) => {
        // });
        Promise.resolve().then(function () { return __importStar(require(moduleId)); }).then(function (m) {
            var dependencies = [];
            var module = _this.getCacheByModuleId(moduleId);
            if (module) {
                module.children.forEach(function (child) {
                    dependencies.push(child.id);
                });
            }
            onGathered(dependencies);
        })["catch"](function (reason) {
            console.log(reason);
        });
    };
    HMR.prototype.setupWatcher = function (file) {
        return chokidar_1["default"].watch([file], {
            ignoreInitial: true,
            ignored: [
                '.git',
                'node_modules'
            ]
            //...this.options.chokidar,
        });
    };
    HMR.prototype.handleFileChange = function (event, file) {
        var _this = this;
        var moduleId = path_1["default"].resolve(file);
        var module = this.getCacheByModuleId(moduleId);
        console.log(moduleId);
        if (module) {
            if (this.targetId === moduleId) {
                var modulesToReload = [module.id];
                var parentModule = module.parent;
                while (parentModule && parentModule.id !== '.') {
                    modulesToReload.push(parentModule.id);
                    parentModule = parentModule.parent;
                }
                modulesToReload.forEach(function (id) {
                    _this.deleteModuleFromCache(id);
                });
                var dependencies_1 = [];
                require(moduleId);
                this.requireCache[moduleId].children.forEach(function (child) {
                    dependencies_1.push(child.id);
                });
                console.log(dependencies_1);
                // import(moduleId).then((value) => {
                //     console.log(value);
                //     const ff : string[] = [];
                //     this.requireCache[moduleId].children.forEach((child) => {
                //         ff.push(child.id);
                //     })
                //     console.log(ff);
                // })
                // this.reloadModule(moduleId).then((value) => {
                //     const dependencies : string[] = [];
                //     const module : NodeModule = this.getCacheByModuleId(moduleId);
                //     if (module) {
                //         value.somefnc('It is working!');
                //         module.children.forEach((child : NodeModule) => {
                //             dependencies.push(child.id);
                //         });
                //         console.log('id = ' + moduleId);
                //         console.log(module.isPreloading);
                //         console.log(module.loaded);
                //         console.log(value);
                //         console.log(dependencies);
                //     } else {
                //         console.error('Fail');
                //     }
                // }).catch((reason : any) => {
                //     console.log(reason);
                // });
                //this.reloadModule(moduleId);
                //console.log('Child list');
                // this.requireCache[moduleId].children.forEach((child : NodeModule) => {
                //     console.log(child.id);
                // })
                //this.deleteModuleFromCache(moduleId);
                //console.log(this.collectDependenciesOfModule(moduleId));
                //this.callback({added: [], deleted: [], modified: []});
            }
        }
        // if (module) {
        //     const modulesToReload : string[] = [module.id];
        //     let parentModule : NodeModule = module.parent;
        //     while (parentModule && parentModule.id !== '.') {
        //        modulesToReload.push(parentModule.id);
        //        parentModule = parentModule.parent;
        //     }
        //     modulesToReload.forEach((id : string) => {
        //         this.deleteModuleFromCache(id);
        //     });
        //     if (this.target === moduleId) {
        //         let added_dependencies : string[] = [];
        //         let deleted_dependencies : Set<string> = this.dependencies;
        //         let updated_dependencies : string[] = this.collectDependenciesOfModule(moduleId);
        //         updated_dependencies.forEach((id : string) => { 
        //             if (deleted_dependencies.has(id)) {
        //                 deleted_dependencies.delete(id);
        //             } else {
        //                 added_dependencies.push(id);
        //             }
        //         });
        //         this.dependencies = new Set(updated_dependencies);
        //         console.log(this.dependencies);
        //         this.callback({added: added_dependencies, deleted: Array.from(deleted_dependencies), modified: []});
        //     } else {
        //         this.callback({added: [], deleted: [], modified: [module.id]});
        //     }
        // }
        // if (module) {
        //     const modulesToReload : string[] = [module.id];
        //     let parentModule : NodeModule = module.parent;
        //     while (parentModule && parentModule.id !== '.') {
        //         modulesToReload.push(parentModule.id);
        //         parentModule = parentModule.parent;
        //     }
        //     modulesToReload.forEach((id) => {
        //         this.deleteModuleFromCache(id);
        //     });
        //     console.log(this.getCacheByModuleId(moduleId));
        // }
        // const moduleId : string = path.resolve(this.watchDir, file);
        // const module : NodeModule = this.getCacheByModuleId(moduleId);
        // if (module) {
        //     if (this.options.debug) {
        //         console.info({ modulesToReload });
        //     }
        // } 
    };
    return HMR;
}());
module.exports.hmr = function (target, callback) {
    var instance = new HMR();
    instance.watchTargetFile(target, callback);
};
