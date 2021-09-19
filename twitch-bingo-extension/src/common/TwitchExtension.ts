export interface TwitchHostingInfo {
    hostedChannelId: number;
    hostingChannelId: number;
}

export interface TwitchContext {
    arePlayerControlsVisible: boolean;
    bitrate: number;
    bufferSize: number;
    displayResolution: string;
    game: string;
    hlsLatencyBroadcaster: number;
    hostingInfo: TwitchHostingInfo;
    isFullScreen: boolean;
    isMuted: boolean;
    isPaused: boolean;
    isTheatreMode: boolean;
    language: string;
    mode: string;
    playbackMode: string;
    theme: string;
    videoResolution: string;
    volume: number;
}

export interface TwitchPubSubPerm {
    listen: string[];
    send: string[];
}

export interface TwitchJWT {
    channel_id: string;
    exp: Date;
    is_unlinked: boolean;
    opaque_user_id: string;
    pubsub_perms: TwitchPubSubPerm;
    role: string;
    user_id: string;
}

export interface TwitchAuthCallbackContext {
    channelId: string;
    clientId: string;
    token: TwitchJWT;
    userId: string;
}

export interface TwitchExtensionConfiguration {
    content: string;
    version: string;
}

export interface TwitchExtensionPosition {
    x: number;
    y: number;
}

export interface TwitchExtensionConfigurationHelper {
    broadcaster: TwitchExtensionConfiguration;
    developer: TwitchExtensionConfiguration;
    global: TwitchExtensionConfiguration;
    onChanged: (callback: (config: TwitchExtensionConfiguration) => void) => void;
    set: (segment: string, version: string, content: string) => void;
}

export interface SubscriptionStatus {
    tier: string;
}

export interface TwitchExtensionViewerHelper {
    opaqueId: string;
    id: string;
    role: string;
    isLinked: boolean;
    sessionToken: string;
    subscriptionStatus: SubscriptionStatus;
    onChange: (callback: () => void) => void;
}

export interface TwitchExtensionRigHelper {
    log: (message: string) => void;
}

export interface TwitchExtensionActionsHelper {
    followChannel: (channelName: string) => void;
    minimize: () => void;
    onFollow: (callback: (didFollow: boolean, channelName: string) => void) => void;
    requestIdShare: () => void;
}

export interface TwitchExtensionFeaturesHelper {
    isBitsEnabled: boolean;
    isChatEnabled: boolean;
    isSubscriptionStatusAvailable: boolean;
    onChanged: (callback: (changed: string[]) => void) => void;
}

export interface TwitchExtensionHelper {
    onAuthorized: (authCallback: (context: TwitchAuthCallbackContext) => void) => void;
    onContext: (contextCallback: (context: TwitchContext, changedProperties: string[]) => void) => void;
    onError: (errorCallback: (error: any) => void) => void;
    onHighlightChanged: (callback: (isHighlighted: boolean) => void) => void;
    onPositionChanged: (callback: (position: TwitchExtensionPosition) => void) => void;
    onVisibilityChanged: (callback: (isVisible: boolean, context: TwitchContext) => void) => void;
    send: (target: string, contentType: string, message: any) => void;
    listen: (target: string, callback: (target: string, contentType: string, message: string) => void) => void;
    unlisten: (target: string, callback: (target: string, contentType: string, message: string) => void) => void;
    actions: TwitchExtensionActionsHelper;
    configuration: TwitchExtensionConfigurationHelper;
    viewer: TwitchExtensionViewerHelper;
    rig: TwitchExtensionRigHelper;
    features: TwitchExtensionFeaturesHelper;
}

type TwitchExtensionQueryParameters = {
    anchor: string;
    language: string;
    locale: string;
    mode: string;
    platform: string;
    popout: boolean;
    state: string;
}

function readTwitchQueryParameters(): TwitchExtensionQueryParameters
{
    var queryParams = new URLSearchParams(window.location.search);
    return {
        anchor: queryParams.get('anchor'),
        language: queryParams.get('language'),
        locale: queryParams.get('locale'),
        mode: queryParams.get('mode'),
        platform: queryParams.get('platform'),
        popout: queryParams.get('popout') === 'true',
        state: queryParams.get('state'),
    }
}

export const TwitchExtHelper: TwitchExtensionHelper = (<any>window).Twitch.ext;
export const TwitchExtQuery: TwitchExtensionQueryParameters= readTwitchQueryParameters();