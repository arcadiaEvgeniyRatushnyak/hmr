import path from 'path';
import chokidar from 'chokidar';

class HMR {
    private parentModuleName : string;
    private requireCache : NodeJS.Dict<NodeModule>;
    private callback : (path : string) => void;
    private options : any;
    private watchDir : string;

    constructor() {
        this.parentModuleName = module.parent.filename;
        this.requireCache = require.cache;
    }

    init(callback : (path : string) => void, options : any) : void {
        this.callback = callback;
        this.options = options;
    
        let watchDir = path.dirname(this.parentModuleName);
        if (options.watchDir) {
            watchDir = path.resolve(watchDir, options.watchDir);
        }
    
        this.watchDir = watchDir;
    
        const watcher : chokidar.FSWatcher = this.setupWatcher();
        watcher.on('all', this.handleFileChange.bind(this));
        this.callback(this.watchDir);
    }

    getCacheByModuleId(moduleId : string) : NodeModule {
        return this.requireCache[moduleId];
    }
    
    deleteModuleFromCache(moduleId : string) : void {
      delete this.requireCache[moduleId];
    }

    setupWatcher() : chokidar.FSWatcher {
        return chokidar.watch(['**/*.js'], {
            ignoreInitial: true,
            cwd: this.watchDir,
            ignored: [
              '.git',
              'node_modules',
            ],
            ...this.options.chokidar,
        });
    }
    
    handleFileChange(event : any, file : string) : void {
        const moduleId : string = path.resolve(this.watchDir, file);
        const module : NodeModule = this.getCacheByModuleId(moduleId);

        if (module) {
            const modulesToReload : string[] = [module.id];
            let parentModule : NodeModule = module.parent;

            while (parentModule && parentModule.id !== '.') {
                modulesToReload.push(parentModule.id);
                parentModule = parentModule.parent;
            }

            modulesToReload.forEach((id) => {
                this.deleteModuleFromCache(id);
            });

            if (this.options.debug) {
                console.info({ modulesToReload });
            }

            this.callback(this.watchDir);
        } 
    }   
}

const instance : HMR = new HMR();

export default function hmr(path : string, callback : (path : string) => void, options : any = {}) {
    options.watchDir = path;    
    instance.init(callback, options);
}