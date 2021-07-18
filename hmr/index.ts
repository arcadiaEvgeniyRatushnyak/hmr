import path from 'path';
import chokidar from 'chokidar';
import process from 'process';
import { throttle } from 'throttle-debounce';
import { watch } from 'fs';
 
export interface HMREvent {
    added: string[],
    modified: string[],
    deleted: string[]
}

class HMR {
    private targetId: string;
    private dependencies: Set<string>;
    private requireCache : NodeJS.Dict<NodeModule>;
    private callback : (event : HMREvent) => void;

    constructor() {
        this.requireCache = require.cache;
    }

    getCacheByModuleId(moduleId : string) : NodeModule {
        return this.requireCache[moduleId];
    }

    deleteModuleFromCache(moduleId : string) : void {
        delete this.requireCache[moduleId];
    }

    reloadModule(moduleId : string, count : number) : void {
        try {
            console.log('Reload module try = ' + count);
            const m = require(moduleId);
            console.log(m);
        } catch(ex) {
            console.log('Exception thrown');
            console.log(ex);
        }
    }

    collectDependenciesOfModule(moduleId : string) : string[] {
        const dependencies : string[] = [];
        const module = this.getCacheByModuleId(moduleId);

        if (module) {
            const modulesToReload : string[] = [module.id];
            let parentModule : NodeModule = module.parent;

            while(parentModule && parentModule.id !== '.') {
                modulesToReload.push(parentModule.id);
                parentModule = parentModule.parent;
            }

            modulesToReload.forEach((id : string) => {
                this.deleteModuleFromCache(id);
            });

            //this.reloadModule(moduleId, 1);

            try {
                // Reload module
                require(moduleId);
                console.log(require.cache[moduleId]);
            } catch(ex) {
                console.log('F some body');
                console.error(ex);
            }

            // if (this.getCacheByModuleId(moduleId).children.length === 0) {
            //     console.error('Falt');
            //     console.error(this.getCacheByModuleId(moduleId));
            // }

            this.getCacheByModuleId(moduleId).children.forEach((child : NodeModule) => {
                dependencies.push(child.id);
            });
        }

        return dependencies;
    }

    setupWatcher() : chokidar.FSWatcher {
        return chokidar.watch(['**/*.js'], {
            ignoreInitial: true,
            ignored: [
              '.git',
              'node_modules'
            ]
        });
    }
    
    watchTargetFile(target : string, callback : (event : HMREvent) => void) : void {
        const moduleId = path.resolve(target);
        const module = this.getCacheByModuleId(moduleId);
        this.targetId = moduleId;
        this.callback = callback;

        if (module) {
            this.dependencies = new Set();
            this.requireCache[moduleId].children.forEach((child : NodeModule) => {
                this.dependencies.add(child.id);
            });

            const watcher = chokidar.watch(['**/*.js'], {
                ignoreInitial: true, 
                ignored: [
                    '.git',
                    'node_modules'
                ]
            })
            
            //this.setupWatcher();
            watcher.on('all',
            // throttle(500, (event : string, file : string) => {
            //     console.log(file);
            //     this.handleFileChange(event, file);
            // })
                this.handleFileChange.bind(this)
            );

            // watch(this.targetId, (event : string, filename : string) => {
            //     console.log('File changed ' + event + ' ' + filename);
            //     this.handleFileChange(event, filename);
            // });
        }
    }
    
    handleFileChange(event : string, file : string) : void {
        if (event !== 'change') return;

        const moduleId : string = path.resolve(file);
        const module : NodeModule = this.getCacheByModuleId(moduleId);
        
        console.log(moduleId);
        
        if (module) {
            if (this.targetId === moduleId) {
                const dependencies : string[] = this.collectDependenciesOfModule(moduleId);
                if (dependencies.length !== 2) {
                    console.log('Number of dependencies != 2');
                    console.log(dependencies);
                    console.log(this.getCacheByModuleId(moduleId));
                    const w : string[] = [];
                    this.getCacheByModuleId(moduleId).children.forEach((child : NodeModule) => {
                        w.push(child.id);
                    });
                    console.log(w);
                    process.exit(-1);
                }

                const new_dependencies : string[] = [];
                const old_dependencies : Set<string> = this.dependencies;

                dependencies.forEach((dependency : string) => {
                    if (old_dependencies.has(dependency)) {
                        old_dependencies.delete(dependency);
                    } else {
                        new_dependencies.push(dependency);
                    }
                });

                this.dependencies = new Set(dependencies);

                this.callback({
                    added: new_dependencies,
                    modified: [],
                    deleted: Array.from(old_dependencies)
                });
            } else if (this.dependencies.has(moduleId)) {
                this.callback({
                    added: [],
                    modified: [module.id],
                    deleted: []
                });
            }
        }
    }   
}

module.exports = function (target : string, callback : (event : HMREvent) => void) {
    let instance : HMR = new HMR();
    instance.watchTargetFile(target, callback);
}