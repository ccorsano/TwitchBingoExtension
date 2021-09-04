import React from 'react';
import { Suspense } from 'react';
import clsx from 'clsx';
import BingoGameComponent, { ActiveGameContext } from '../../common/BingoGameComponent';
import { BingoGameContext } from '../../common/BingoGameContext';
import BingoGameModerationComponent, { ActiveGameModerationContext } from '../../common/BingoGameModerationComponent';
import { getRGB, jasminePalette } from '../../common/BingoThemes';
import LinearIndeterminateLoader from '../../common/LinearIndeterminateLoader';
import { TwitchExtHelper } from '../../common/TwitchExtension';
import { BingoTentativeNotification, ParseTimespan } from '../../EBS/BingoService/EBSBingoTypes';
import { I18nContext } from '../../i18n/i18n-react';
import OverlayBingoGrid from './OverlayBingoGrid';
const ModerationPane = React.lazy(() => import('./ModerationPane'));
import VideoOverlayTabWidget from './TabWidget';
require('./VideoOverlay.scss');
require('../../common/BingoStyles.scss');
require('../../common/BingoViewerEntry.scss');

export default function VideoOverlay()
{
    const { LL } = React.useContext(I18nContext)
    
    const [isCollapsed, setCollapsed] = React.useState(true)
    const [moderationDrawerOpen, setModerationDrawerOpen] = React.useState(false)
    const [isWidgetShown, setWidgetShown] = React.useState(true)
    const [hasModNotifications, setHasModNotifications] = React.useState(false)
    const [isModDrawerAutoOpened, setModDrawerAutoOpened] = React.useState(false)
    const [isShowingIdentityPrompt, setShowingIdentityPrompt] = React.useState(false)

    React.useEffect(() => {
        const onContext = (context, _) => {
            setWidgetShown(context.arePlayerControlsVisible !== false)
        }
        TwitchExtHelper.onContext(onContext)
        return () => {
            TwitchExtHelper.onContext(null)
        }
    }, [])
    

    const onTentativeNotification = (_tentative: BingoTentativeNotification) => {
        if (!moderationDrawerOpen)
        {
            setModDrawerAutoOpened(true)
            setModerationDrawerOpen(true)
        }
        setHasModNotifications(true)
    }

    const onNotificationsEmpty = () => {
        if (isModDrawerAutoOpened)
        {
            setModerationDrawerOpen(false)
        }
        setHasModNotifications(false)
    }

    const drawingAreaClick = React.useCallback((_) => {
        if (! isCollapsed)
        {
            setCollapsed(true);
        }
    }, [isCollapsed])

    const onToggleGrid = React.useCallback((gameContext: BingoGameContext) => {
        if (!gameContext.hasSharedIdentity){
            setShowingIdentityPrompt(!isShowingIdentityPrompt)
            return
        }
        setShowingIdentityPrompt(false);
        setCollapsed(!isCollapsed)
    }, [isCollapsed, isShowingIdentityPrompt])

    const onSharedIdentityChange = React.useCallback((isShared: boolean) => {
        if (isShared && isShowingIdentityPrompt)
        {
            setShowingIdentityPrompt(false)
        }
        if (!isShared && !isCollapsed)
        {
            setCollapsed(true)
        }
    }, [isShowingIdentityPrompt, isCollapsed])

    return (
        <BingoGameComponent onSharedIdentity={onSharedIdentityChange}>
            <ActiveGameContext.Consumer>
                {
                    gameContext => {
                        var layoutClass = ""
                        if (gameContext.game)
                        {
                            if (gameContext.game.rows >= gameContext.game.columns && gameContext.game.columns < 4)
                            {
                                layoutClass = "tall"
                            }
                            else
                            {
                                layoutClass = "wide"
                            }
                        }

                        var moderationDrawer: JSX.Element = null;
                        if (gameContext.canModerate)
                        {
                            moderationDrawer = (
                                <Suspense fallback={<LinearIndeterminateLoader />}>
                                    <BingoGameModerationComponent
                                        activeGame={gameContext.game}
                                        onReceiveTentative={onTentativeNotification}
                                        onNotificationsEmpty={onNotificationsEmpty} >
                                        <ActiveGameModerationContext.Consumer>
                                            {
                                                moderationContext => {
                                                    return (
                                                        <ModerationPane
                                                            game={gameContext.game}
                                                            tentatives={moderationContext.tentatives}
                                                            isOpen={moderationDrawerOpen}
                                                            isStarted={gameContext.isStarted}
                                                            onOpen={() => {setModerationDrawerOpen(true)}}
                                                            onClose={(_) => {setModerationDrawerOpen(false)}}
                                                            gameId={gameContext.game?.gameId}
                                                            confirmationTimeout={ParseTimespan(gameContext.game?.confirmationThreshold ?? "00:00:00")}
                                                            onReceiveTentative={onTentativeNotification}
                                                            onNotificationsEmpty={onNotificationsEmpty}
                                                            onTentativeExpire={moderationContext.onTentativeExpire} />
                                                    )
                                                }
                                            }
                                        </ActiveGameModerationContext.Consumer>
                                    </BingoGameModerationComponent>
                                </Suspense>
                            )
                        }
                
                        return [
                            <div id="bingoRenderingArea" className={layoutClass}>
                                <div id="safeAreaTop" style={{ gridColumnStart: 1, gridColumnEnd: 4, gridRow: 1, height: '14vh', width: '100%' }} onClickCapture={drawingAreaClick}></div>
                                <div style={{ gridColumn: 1, gridRow: 2, height: '75vh' }} onClickCapture={drawingAreaClick}>
                                    <VideoOverlayTabWidget
                                        shown={isWidgetShown}
                                        collapsed={isCollapsed}
                                        canModerate={gameContext.canModerate}
                                        hasModNotifications={hasModNotifications}
                                        onToggleGrid={() => onToggleGrid(gameContext)}
                                        onToggleModerationPane={(_) => {setModerationDrawerOpen(!moderationDrawerOpen)}} />
                                    { gameContext.canModerate ? moderationDrawer : null }
                                </div>
                                <div id="bingoGridArea" style={{ gridColumn: 2, gridRow: 2, width: '1fr', marginLeft: '2vw', height: '76vh', overflow: 'hidden' }}>
                                    {
                                        isShowingIdentityPrompt ? (
                                            <div style={
                                                {
                                                    backgroundColor: getRGB(jasminePalette.base),
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    paddingTop: '1vw',
                                                    paddingBottom: '1vw',
                                                    borderRadius: '0.25vw',
                                                    transition: 'opacity 0.5s',
                                                }}>
                                                <div style={{marginBottom: '2rem', marginTop: '1rem'}}>
                                                    {LL.OverlayBingoGrid.IdentityPromptMessage()}
                                                </div>
                                                <div
                                                    className={clsx("bingoCellPrompt", "bingoCellPromptVisible")}
                                                    style={{position: 'unset'}}
                                                    onClickCapture={(_) => gameContext.promptIdentity()}>
                                                    {LL.OverlayBingoGrid.ShareIdentityButtonLabel()}
                                                </div>
                                            </div>
                                        ) : null
                                    }
                                    <OverlayBingoGrid
                                        isCollapsed={isCollapsed}
                                    />
                                </div>
                                <div style={{ gridColumn: 3, gridRow: 2, width: '7rem', height: '75vh' }} onClickCapture={drawingAreaClick}>
                                </div>
                                <div id="safeAreaBottom" style={{ gridColumnStart: 1, gridColumnEnd: 4, gridRow: 3, height: '9vh', width: '100%' }} onClickCapture={drawingAreaClick}></div>
                            </div>
                        ];
                    }
                }
            </ActiveGameContext.Consumer>
        </BingoGameComponent>
    )
}
