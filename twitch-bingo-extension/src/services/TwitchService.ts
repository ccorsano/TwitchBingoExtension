import type { TwitchAuthCallbackContext, TwitchExtensionConfiguration } from "../common/TwitchExtension";
import { TwitchExtHelper } from "../common/TwitchExtension";

// Array with a callback on push, used to automatically call callback on registration if needed
class CallbackArray<T> extends Array<T> {
    onPush: {(item: T):void} = (i) => {}

    constructor(onPush: {(item: T):void})
    {
        super()
        this.onPush = onPush
    }

    push(item: T) : number {
        this.onPush(item)
        return super.push(item)
    }
}

export default class TwitchService {
    onAuthorized: CallbackArray<{(context: TwitchAuthCallbackContext):void}>
    onConfiguration: CallbackArray<{(config: TwitchExtensionConfiguration):void}>

    configuration: TwitchExtensionConfiguration = { content: "", version: "" };
    authToken: TwitchAuthCallbackContext | undefined = undefined;

    authReady: boolean = false
    confReady: boolean = false

    constructor()
    {
        this._onPushAuthorizedHandler = this._onPushAuthorizedHandler.bind(this)
        this._onPushConfigurationHandler = this._onPushConfigurationHandler.bind(this)
        this.onAuthorized = new CallbackArray<{(context: TwitchAuthCallbackContext):void}>(this._onPushAuthorizedHandler)
        this.onConfiguration = new CallbackArray<{(config: TwitchExtensionConfiguration):void}>(this._onPushConfigurationHandler)

        this._onAuthorized = this._onAuthorized.bind(this);
        this._onConfiguration = this._onConfiguration.bind(this);

        TwitchExtHelper.onAuthorized(this._onAuthorized);
        TwitchExtHelper.configuration.onChanged(this._onConfiguration);
    }

    setConfiguration = (configuration: string, version: string) => {
        TwitchExtHelper.configuration.set('broadcaster', version, configuration);
        this.configuration = {content: configuration, version: version};
    }

    send = (target: string, contentType: string, message: any) => {
        TwitchExtHelper.send(target, contentType, message);
    }

    listen = (channel: string, callback: {(target: string, contentType: string, message: string):void}) => {
        TwitchExtHelper.listen(channel, callback);
    }

    unlisten = (channel: string, callback: {(target: string, contentType: string, message: string):void}) => {
        TwitchExtHelper.unlisten(channel, callback);
    }

    _onAuthorized = (context: TwitchAuthCallbackContext) => {
        this.authToken = context
        this.authReady = true
        this.onAuthorized.forEach(handler => {
            handler(context);
        });
    }

    _onConfiguration = () => {
        this.configuration = TwitchExtHelper.configuration.broadcaster;
        this.confReady = true
        this.onConfiguration.forEach(handler => {
            handler(TwitchExtHelper.configuration.broadcaster);
        })
    }

    _onPushAuthorizedHandler = (cb: {(context: TwitchAuthCallbackContext):void}) => {
        if (this.authReady)
        {
            cb(this.authToken!)
        }
    }

    _onPushConfigurationHandler = (cb: {(config: TwitchExtensionConfiguration):void}) => {
        if (this.confReady)
        {
            cb(this.configuration)
        }
    }
}

export const Twitch = new TwitchService();