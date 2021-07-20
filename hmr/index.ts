import path from 'path';
import chokidar from 'chokidar';
import decache from 'decache';

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
        decache(moduleId);
    }

    collectDependenciesOfModule(moduleId : string) : Set<string> {
        const dependencies : Set<string> = new Set();
        const module = this.getCacheByModuleId(moduleId);

        if (module) {
            const modulesToReload : string[] = [module.id];
            // let parentModule : NodeModule = module.parent;

            // while(parentModule && parentModule.id !== '.') {
            //     modulesToReload.push(parentModule.id);
            //     parentModule = parentModule.parent;
            // }

            modulesToReload.forEach((id : string) => {
                this.deleteModuleFromCache(id);
            });

            try {
                require(moduleId);
            } catch(ex) {
                console.error(ex);
            }

            this.getCacheByModuleId(moduleId).children.forEach((child : NodeModule) => {
                dependencies.add(child.id);
            });
        }

        return dependencies;
    }
    
    watchTargetFile(target : string, callback : (event : HMREvent) => void) : void {
        const moduleId = path.resolve(target);
        const module = this.getCacheByModuleId(moduleId);
       
        this.targetId = moduleId;
        this.dependencies = new Set();
        this.callback = callback;

        if (module) {            
            this.getCacheByModuleId(moduleId).children.forEach((child : NodeModule) => {
                this.dependencies.add(child.id);
            });

            chokidar.watch(['**/*.js'], {
                ignoreInitial: true, 
                ignored: [
                    '.git',
                    'node_modules'
                ]
            }).on('change', this.handleFileChange.bind(this));
        }
    }
    
    handleFileChange(file : string) : void {
        const moduleId : string = path.resolve(file);
        const module : NodeModule = this.getCacheByModuleId(moduleId);
        
        if (module) {
            if (this.targetId === moduleId) {                
                const newDependencies : string[] = [];
                const oldDependencies : Set<string> = this.dependencies;

                this.dependencies = this.collectDependenciesOfModule(moduleId);

                this.dependencies.forEach((dependency : string) => {
                    if (oldDependencies.has(dependency)) {
                        oldDependencies.delete(dependency);
                    } else {
                        newDependencies.push(dependency);
                    }
                });

                this.callback({
                    added: newDependencies,
                    modified: [],
                    deleted: Array.from(oldDependencies)
                });
            } else if (this.dependencies.has(moduleId)) {
                this.callback({
                    added: [],
                    modified: [moduleId],
                    deleted: []
                });
            }
        }
    }   
}

module.exports = function(target : string, callback : (event : HMREvent) => void) {
    const instance : HMR = new HMR();
    instance.watchTargetFile(target, callback);
}