import path from 'path';
import chokidar from 'chokidar';

export interface HMREvent {
    added: string[],
    modified: string[],
    deleted: string[]
}

class HMR {
    private targetId: string;
    private dependencies: Set<string>;
    private parentModuleName : string;
    private requireCache : NodeJS.Dict<NodeModule>;
    private callback : (event : HMREvent) => void;
    private options : any;
    private watchDir : string;

    constructor() {
        this.parentModuleName = module.parent.filename;
        this.requireCache = require.cache;
    }

    watchTargetFile(target : string, callback : (event : HMREvent) => void) : void {
        const moduleId = path.resolve(target);
        const module = this.getCacheByModuleId(moduleId);
        this.targetId = moduleId;
        this.callback = callback;

        if (module) {
            this.dependencies = new Set(this.collectDependenciesOfModule(moduleId));

            const watcher = this.setupWatcher(target);
            watcher.on('all', this.handleFileChange.bind(this));
        }
    }

    init(target : string, callback : (event : HMREvent) => void) : void {
        // this.targetId = target;
        // this.callback = callback;
        // this.watchDir = path.dirname(target);

        //let watchDir = path.dirname(target);
        
        // if (options.watchDir) {
        //     watchDir = path.resolve(watchDir, options.watchDir);
        // }
    
        // const watcher : chokidar.FSWatcher = this.setupWatcher();
        // watcher.on('all', this.handleFileChange.bind(this));
    }

    getCacheByModuleId(moduleId : string) : NodeModule {
        return this.requireCache[moduleId];
    }

    reloadModule(moduleId : string) : Promise<any> {
        delete this.requireCache[moduleId];
        return import(moduleId);
    }
    
    deleteModuleFromCache(moduleId : string) : void {
        delete this.requireCache[moduleId];
        //require(moduleId);
    }

    collectDependenciesOfModule(moduleId : string) : string[] {
        const dependencies : string[] = [];
        const module : NodeModule =  this.getCacheByModuleId(moduleId);

        if (module) {
            module.children.forEach((child : NodeModule) => {
                dependencies.push(child.id);
            });
        } else {
            console.log('Fail to find: ' + moduleId);
        }

        return dependencies;
    }

    gatherDependencies(moduleId : string, onGathered : (list : string[]) => void) : void {
        delete this.requireCache[moduleId];

        // require([moduleId], (m) => {

        // });

        import(moduleId).then((m) => {
            const dependencies : string[] = [];
            const module : NodeModule = this.getCacheByModuleId(moduleId);

            if (module) {
                module.children.forEach((child : NodeModule) => {
                    dependencies.push(child.id);
                });
            }

            onGathered(dependencies);
        }).catch((reason : any) => {
            console.log(reason);
        });
    }

    setupWatcher(file : string) : chokidar.FSWatcher {
        return chokidar.watch([file], {
            ignoreInitial: true,
            ignored: [
              '.git',
              'node_modules'
            ]
            //...this.options.chokidar,
        });
    }
    
    handleFileChange(event : any, file : string) : void {
        const moduleId : string = path.resolve(file);
        const module : NodeModule = this.getCacheByModuleId(moduleId);

        console.log(moduleId);

        if (module) {
            if (this.targetId === moduleId) {
                const modulesToReload = [module.id];
                let parentModule = module.parent;

                while (parentModule && parentModule.id !== '.') {
                    modulesToReload.push(parentModule.id);
                    parentModule = parentModule.parent;
                }

                modulesToReload.forEach((id) => {
                    this.deleteModuleFromCache(id);
                });

                const dependencies : string[] = [];
                require(moduleId);

                this.requireCache[moduleId].children.forEach((child) => {
                    dependencies.push(child.id);
                });

                console.log(dependencies);

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
    }   
}

module.exports.hmr = function (target : string, callback : (event : HMREvent) => void) {
    let instance : HMR = new HMR();
    instance.watchTargetFile(target, callback);
}