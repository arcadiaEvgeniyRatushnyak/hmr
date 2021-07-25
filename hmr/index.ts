import path from 'path';
import chokidar from 'chokidar';
import fs from 'fs';

interface HMREvent {
    added : string[],
    modified : string[],
    deleted : string[]
}

class HMR {
    private targetId : string;
    private dependencies : Set<string>;
    private callback : (event : HMREvent) => void;
    private errorHandler : (err : any) => void;

    constructor() {}

    isValidModule(moduleId : string) : boolean {
        return fs.readFileSync(moduleId).toString().trim() !== '';
    }

    getCacheByModuleId(moduleId : string) : NodeModule {
        return require.cache[moduleId];
    }

    deleteModuleFromCache(moduleId : string) : void {
        delete require.cache[moduleId];
    }

    reloadModule(moduleId : string) : Promise<any> {
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

        return import(moduleId);
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
    
    watchTargetFile(target : string, callback : (event : HMREvent) => void, errorHandler : (err : any) => void) : void {
        const moduleId = path.resolve(target);

        this.reloadModule(moduleId).then(() => {
            this.targetId = moduleId;
            this.dependencies = this.collectDependenciesOfModule(moduleId);
            this.callback = callback;
            this.errorHandler = errorHandler;
            
            chokidar.watch(['**/*.js'], {
                ignoreInitial: true, 
                ignored: [
                    '.git',
                    'node_modules'
                ]
            }).on('change', this.handleFileChange.bind(this));
        }).catch((err) => {
            this.errorHandler(err);
        });
    }
    
    handleFileChange(file : string) : void {
        const moduleId : string = path.resolve(file);

        if (this.dependencies.has(moduleId)) {
            this.callback({
                added: [],
                modified: [moduleId],
                deleted: []
            });
        } else if (this.targetId === moduleId && this.isValidModule(moduleId)) {
            this.reloadModule(moduleId).then(() => {
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
            }).catch((err) => {
                this.errorHandler(err);
            });
        }      
    }   
}

export = function(target : string, callback : (event : HMREvent) => void, errorHandler ?: (err : any) => void) {
    const instance : HMR = new HMR();
    const handler : (err : any) => void = errorHandler ? errorHandler : (err : any) => { console.log(err); };
    instance.watchTargetFile(target, callback, handler);
}