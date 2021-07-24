import path from 'path';
import chokidar from 'chokidar';
import fs from 'fs';

interface HMREvent {
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

    isValidModule(moduleId : string) : boolean {
        return fs.readFileSync(moduleId).toString().trim() !== '';
    }

    getCacheByModuleId(moduleId : string) : NodeModule {
        return require.cache[moduleId];
    }

    deleteModuleFromCache(moduleId : string) : void {
        delete require.cache[moduleId];
    }

    reloadModule(moduleId : string): boolean {
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
        }

        try {
            require(moduleId);
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }
    }

    collectDependenciesOfModule(moduleId : string) : Set<string> {
        const dependencies : Set<string> = new Set();
        const module = this.getCacheByModuleId(moduleId);

        if (module) {
            module.children.forEach((child : NodeModule) => {
                dependencies.add(child.id);
            });
        }

        return dependencies;
    }
    
    watchTargetFile(target : string, callback : (event : HMREvent) => void) : void {
        const moduleId = path.resolve(target);
        const module = this.getCacheByModuleId(moduleId);

        if (module) {            
            this.targetId = moduleId;
            this.dependencies = this.collectDependenciesOfModule(moduleId);
            this.callback = callback;

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
        require(moduleId);
        
        if (this.getCacheByModuleId(moduleId)) {
            if (this.targetId === moduleId && this.isValidModule(moduleId)) {    
                const newDependencies : string[] = [];
                const oldDependencies : Set<string> = this.dependencies;

                if (this.reloadModule(moduleId)) {
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
                }
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

export = function(target : string, callback : (event : HMREvent) => void) {
    const instance : HMR = new HMR();
    instance.watchTargetFile(target, callback);
}