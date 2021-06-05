import ViewerBingoComponentBase from '../../common/ViewerBingoComponentBase';
import { ViewerBingoComponentBaseState, ViewerBingoComponentBaseProps } from '../../common/ViewerBingoComponentBase';


interface MobileProps extends ViewerBingoComponentBaseProps {
}

interface MobileState extends ViewerBingoComponentBaseState {
}

export default class Mobile extends ViewerBingoComponentBase<MobileProps, MobileState> {
    state: MobileState = {
        entries: new Array(0),
        rows: 3,
        columns: 3,
        canModerate: false,
        canVote: false,
    }

    constructor(props: any){
        super(props)
    };

    componentDidMount() {
        super.componentDidMount();
    };

    render(){
        return super.render();
    }
}