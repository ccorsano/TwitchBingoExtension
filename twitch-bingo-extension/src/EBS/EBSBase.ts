import { Twitch } from '../services/TwitchService';
import type { TwitchAuthCallbackContext, TwitchExtensionConfiguration } from "../common/TwitchExtension";

export interface EBSError {
    status: number,
    statusText: string,
}

export class EBSBase {
    context: TwitchAuthCallbackContext;
    configuration: TwitchExtensionConfiguration;
    baseUrl: string;
    onConfigured: (auth: TwitchAuthCallbackContext, config: TwitchExtensionConfiguration) => void;
    onAuthorized: (context: TwitchAuthCallbackContext) => void;
    onConfiguration: (configuration: TwitchExtensionConfiguration) => void;

    configuredPromise: Promise<[TwitchAuthCallbackContext, TwitchExtensionConfiguration]>;
    contextPromise: Promise<TwitchAuthCallbackContext>;
    configurationPromise: Promise<TwitchExtensionConfiguration>;

    constructor(baseUrl: string){
        this._onAuthorized = this._onAuthorized.bind(this);
        this._onConfiguration = this._onConfiguration.bind(this);
        this.baseUrl = baseUrl;

        Twitch.onAuthorized.push(this._onAuthorized);
        Twitch.onConfiguration.push(this._onConfiguration);

        // Register a callback on onAuthorized to get authentication context
        this.contextPromise = new Promise<TwitchAuthCallbackContext>((resolve, _reject) => {
            Twitch.onAuthorized.push(context => {
                this._onAuthorized(context);
                resolve(context);
            });
        });

        // Register a callback on onConfiguration to get extension configuration
        this.configurationPromise = new Promise<TwitchExtensionConfiguration>((resolve, _reject) => {
            Twitch.onConfiguration.push(_config => {
                this._onConfiguration();
                resolve(this.configuration);
            });
        });

        // Register a promise to signal we're ready to connect to the EBS
        this.configuredPromise = Promise.all([this.contextPromise, this.configurationPromise]);
        this.configuredPromise.then(([authContext, configContext]) => {
            if (this.onConfigured)
            {
                this.onConfigured(authContext, configContext);
            }
        });
        
        Twitch.listen("broadcast", (_target, _contentType, messageStr) => {
            let message = JSON.parse(messageStr);

            if (message.type != "set-config") return;

            this.configuration = message;
            this.configurationPromise = new Promise<TwitchExtensionConfiguration>((resolve, _reject) => {
                resolve(message);
            });
            this.configuredPromise = Promise.all([this.contextPromise, this.configurationPromise]);
            this._onConfiguration();
        });
    }

    // Generic method to call EBS REST APIs
    serviceFetch = async <T>(path: string, init: RequestInit = null): Promise<T> => {
        let [] = await this.configuredPromise;

        const opts: RequestInit = {
            method: init?.method ?? 'GET',
            headers: new Headers({
                'Authorization': 'Bearer ' + this.context.token,
                'Content-Type': 'application/json',
            }),
            body: init?.body,
        };

        var response = await fetch(this.baseUrl + path, opts);

        if (!response.ok) {
            return Promise.reject<T>({
                status: response.status,
                statusText: response.statusText,
            })
        }
        
        return response.json().catch(() => null);
    }

    servicePost = async <T>(path: string, bodyObject: any, init: RequestInit | null = null): Promise<T> => {
        if (! init)
        {
            init = {
                method: 'POST',
                body: JSON.stringify(bodyObject)
            };
        }
        else
        {
            init.method = 'POST';
            init.body = JSON.stringify(bodyObject);
        }
        console.log(path);
        return this.serviceFetch<T>(path, init);
        
    }

    servicePut = async <T>(path: string, bodyObject: any, init: RequestInit | null = null): Promise<T> => {
        if (! init)
        {
            init = {
                method: 'PUT',
                body: JSON.stringify(bodyObject)
            };
        }
        else
        {
            init.method = 'PUT';
            init.body = JSON.stringify(bodyObject);
        }
        console.log(path);
        return this.serviceFetch<T>(path, init);
    }

    serviceDelete = async <T>(path: string, init: RequestInit | null = null): Promise<T> => {
        if (! init)
        {
            init = {
                method: 'DELETE'
            };
        }
        else
        {
            init.method = 'DELETE';
        }
        console.log(path);
        return this.serviceFetch<T>(path, init);
    }

    _onAuthorized = (context: TwitchAuthCallbackContext) => {
        this.context = context;
        if (this.onAuthorized)
        {
            this.onAuthorized(this.context);
        }
        if (this.configuration && this.onConfigured)
        {
            this.onConfigured(this.context, this.configuration);
        }
    }

    _onConfiguration = () => {
        this.configuration = (<TwitchExtensionConfiguration> ((<any>window).Twitch.ext.configuration.broadcaster));

        if (this.onConfiguration)
        {
            this.onConfiguration(this.configuration);
        }
        if (this.context && this.onConfigured)
        {
            this.onConfigured(this.context, this.configuration);
        }
    }
}