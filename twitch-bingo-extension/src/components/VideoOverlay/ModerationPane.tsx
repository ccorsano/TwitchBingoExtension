import { Divider, Drawer, IconButton } from '@material-ui/core';
import { ChevronLeft } from '@material-ui/icons';
import React from 'react';
import ModerationBingoComponent from '../../common/ModerationBingoComponent';
import { BingoEntry } from '../../EBS/BingoService/EBSBingoTypes';

type ModerationPaneProps = {
    isOpen: boolean,
    onOpen: () => void,
    onClose: (e: React.MouseEvent<any>) => void,
    entries: BingoEntry[],
    isStarted: boolean,
    gameId: string,
    confirmationTimeout: number,
}

export default function ModerationPane(props: ModerationPaneProps)
{
    return (
        <React.Fragment>
            <Drawer variant="temporary" anchor="left" open={props.isOpen}>
                <div>
                <IconButton onClick={props.onClose}>
                    <ChevronLeft />
                </IconButton>
                </div>
                <Divider />
                <ModerationBingoComponent
                    entries={props.entries}
                    isStarted={props.isStarted}
                    gameId={props.gameId}
                    confirmationTimeout={props.confirmationTimeout}
                    onReceiveTentative={() => props.onOpen() } />
            </Drawer>
        </React.Fragment>
    );
}