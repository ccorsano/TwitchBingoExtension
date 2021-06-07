import { TwitchAuthCallbackContext, TwitchExtensionConfiguration, TwitchExtHelper } from "../common/TwitchExtension";

export default class TwitchService {
    onAuthorized: {(context: TwitchAuthCallbackContext):void}[] = [];
    onConfiguration: {(config: TwitchExtensionConfiguration):void}[] = [];
    configuration: TwitchExtensionConfiguration = { content: "", version: "" };
    authToken: TwitchAuthCallbackContext = null;

    constructor()
    {
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
        this.authToken = context;
        this.onAuthorized.forEach(handler => {
            handler(context);
        });
    }

    _onConfiguration = () => {
        this.configuration = TwitchExtHelper.configuration.broadcaster;
        this.onConfiguration.forEach(handler => {
            handler(TwitchExtHelper.configuration.broadcaster);
        })
    }
}

export const Twitch = new TwitchService();