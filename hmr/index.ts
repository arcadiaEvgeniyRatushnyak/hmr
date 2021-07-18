import path from 'path';
import chokidar from 'chokidar';
import process from 'process';
import { throttle } from 'throttle-debounce';
import { watch } from 'fs';
import fs from 'fs';
 
export interface HMREvent {
    added: string[],
    modified: string[],
    deleted: string[]
}

class HMR {
    private targetId: string;
    private dependencies: Set<string>;
    private callback : (event : HMREvent) => void;

    constructor() {
    }

    getCacheByModuleId(moduleId : string) : NodeModule {
        return require.cache[moduleId];
    }

    deleteModuleFromCache(moduleId : string) : void {
        delete require.cache[moduleId];
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

            try {
                require(moduleId);
            } catch(ex) {
                console.log('F some body');
                console.error(ex);
            }

            this.getCacheByModuleId(moduleId).children.forEach((child : NodeModule) => {
                dependencies.push(child.id);
            });
        }

        return dependencies;
    }
    
    watchTargetFile(target : string, callback : (event : HMREvent) => void) : void {
        const moduleId = path.resolve(target);
        const module = this.getCacheByModuleId(moduleId);
        this.targetId = moduleId;
        this.callback = callback;

        if (module) {
            this.dependencies = new Set();
            require.cache[moduleId].children.forEach((child : NodeModule) => {
                this.dependencies.add(child.id);
            });

            chokidar.watch(['**/*.js'], {
                ignoreInitial: true, 
                ignored: [
                    '.git',
                    'node_modules'
                ]
            }).on('all', this.handleFileChange.bind(this));
        }
    }
    
    handleFileChange(event : string, file : string) : void {
        if (event !== 'change') return;

        const moduleId : string = path.resolve(file);
        const module : NodeModule = this.getCacheByModuleId(moduleId);
        
        if (module) {
            if (this.targetId === moduleId) {
                const dependencies : string[] = this.collectDependenciesOfModule(moduleId);
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