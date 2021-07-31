import LinearProgress from '@material-ui/core/LinearProgress';
import React from 'react';
import { Suspense } from 'react';
import BingoGameComponent, { ActiveGameContext } from '../../common/BingoGameComponent';
import BingoGameModerationComponent, { ActiveGameModerationContext } from '../../common/BingoGameModerationComponent';
import { TwitchExtHelper } from '../../common/TwitchExtension';
import { BingoTentativeNotification, ParseTimespan } from '../../EBS/BingoService/EBSBingoTypes';
import OverlayBingoGrid from './OverlayBingoGrid';
const ModerationPane = React.lazy(() => import('./ModerationPane'));
import VideoOverlayTabWidget from './TabWidget';
require('./VideoOverlay.scss');

export default function VideoOverlay()
{
    const [isCollapsed, setCollapsed] = React.useState(true)
    const [moderationDrawerOpen, setModerationDrawerOpen] = React.useState(false)
    const [isWidgetShown, setWidgetShown] = React.useState(true)
    const [hasModNotifications, setHasModNotifications] = React.useState(false)
    const [isModDrawerAutoOpened, setModDrawerAutoOpened] = React.useState(false)

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

    return (
        <BingoGameComponent>
            <ActiveGameContext.Consumer>
                {
                    gameContext => {
                        var moderationDrawer: JSX.Element = null;
                        if (gameContext.canModerate)
                        {
                            moderationDrawer = (
                                <Suspense fallback={<LinearProgress variant="indeterminate" />}>
                                    <BingoGameModerationComponent
                                        activeGame={gameContext.game}
                                        onReceiveTentative={onTentativeNotification}
                                        onNotificationsEmpty={onNotificationsEmpty} >
                                        <ActiveGameModerationContext.Consumer>
                                            {
                                                moderationContext => {
                                                    return (
                                                        <ModerationPane
                                                            entries={gameContext.game.entries}
                                                            tentatives={moderationContext.tentatives}
                                                            isOpen={moderationDrawerOpen}
                                                            isStarted={gameContext.isStarted}
                                                            onOpen={() => {setModerationDrawerOpen(true)}}
                                                            onClose={(_) => {setModerationDrawerOpen(false)}}
                                                            gameId={gameContext.game?.gameId}
                                                            confirmationTimeout={ParseTimespan(gameContext.game?.confirmationThreshold ?? "00:00:00")}
                                                            onReceiveTentative={onTentativeNotification}
                                                            onNotificationsEmpty={onNotificationsEmpty} />
                                                    )
                                                }
                                            }
                                        </ActiveGameModerationContext.Consumer>
                                    </BingoGameModerationComponent>
                                </Suspense>
                            )
                        }
                
                        return [
                            <div id="bingoRenderingArea">
                                <div style={{ gridColumnStart: 1, gridColumnEnd: 4, gridRow: 1, height: '6rem', width: '100%' }}></div>
                                <div style={{ gridColumn: 1, gridRow: 2 }}>
                                    <VideoOverlayTabWidget
                                        shown={isWidgetShown}
                                        collapsed={isCollapsed}
                                        canModerate={gameContext.canModerate}
                                        hasModNotifications={hasModNotifications}
                                        onToggleGrid={(_) => { setCollapsed(!isCollapsed)}}
                                        onToggleModerationPane={(_) => {setModerationDrawerOpen(!moderationDrawerOpen)}} />
                                    { gameContext.canModerate ? moderationDrawer : null }
                                </div>
                                <div style={{ gridColumn: 2, gridRow: 2, width: '1fr', marginLeft: '2vw' }}>
                                    <OverlayBingoGrid
                                        isCollapsed={isCollapsed}
                                    />
                                </div>
                                <div style={{ gridColumn: 3, gridRow: 2, width: '7rem' }}>
                                </div>
                                <div style={{ gridColumnStart: 1, gridColumnEnd: 4, gridRow: 3, height: '6rem', width: '100%' }}></div>
                            </div>
                        ];
                    }
                }
            </ActiveGameContext.Consumer>
        </BingoGameComponent>
    )
}
