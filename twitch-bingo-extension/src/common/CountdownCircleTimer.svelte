<script lang="ts">
    import { onMount } from "svelte";

    type OnComplete = {
        /** Indicates if the loop should start over. Default: false */
        shouldRepeat?: boolean
        /** Delay in seconds before looping again. Default: 0 */
        delay?: number
        /** Set new initial remaining when starting over the animation */
        newInitialRemainingTime?: number
    }

    export let size:number = 180
    export let duration:number
    export let colors: string
    export let strokeWidth:number = 12
    export let trailColor: string | undefined = undefined
    export let trailStrokeWidth:number | undefined = undefined
    export let isPlaying:boolean = false
    export let rotation:string = "clockwise"
    export let onComplete: ((totalElapsedTime: number) => OnComplete | void) | undefined  = undefined
    export let onUpdate: ((remainingTime: number) => void) | undefined = undefined
    

    const halfSize = size / 2
    const halfStrokeWith = strokeWidth / 2
    const arcRadius = halfSize - halfStrokeWith
    const arcDiameter = 2 * arcRadius
    const rotationIndicator = rotation === 'clockwise' ? '1,0' : '0,1'

    const pathLength = 2 * Math.PI * arcRadius
    const path = `m ${halfSize},${halfStrokeWith} a ${arcRadius},${arcRadius} 0 ${rotationIndicator} 0,${arcDiameter} a ${arcRadius},${arcRadius} 0 ${rotationIndicator} 0,-${arcDiameter}`

    let elapsedTime:number = 0.0
    let startTime:number|undefined = undefined
    let remainingTime:number = duration
    $: remainingTime = duration - elapsedTime

    function linearEase(time: number, start: number, goal: number, duration:number)
    {
        if (duration === 0) {
            return start
        }
        const currentTime = time / duration
        return start + goal * currentTime
    }

    onMount(() => {
        const interval = setInterval(() => {
            if (isPlaying)
            {
                if (startTime === undefined)
                {
                   startTime = Date.now()
                }
                elapsedTime = (Date.now() - startTime) / 1000.0
                if (onUpdate)
                {
                    onUpdate(elapsedTime)
                }
                if (elapsedTime >= duration && onComplete)
                {
                    onComplete(elapsedTime)
                    elapsedTime = 0.0
                    isPlaying = false
                }
            }
        }, 250);

        return () => clearInterval(interval)
    })
</script>

<div style:position="relative" style:width={size} style:height={size}>
    <svg
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    height={size}
    xmlns="http://www.w3.org/2000/svg"
    >
    <path
        d={path}
        fill="none"
        stroke={trailColor ?? '#d9d9d9'}
        stroke-width={trailStrokeWidth ?? strokeWidth}
    />
    <path
        d={path}
        fill="none"
        stroke={colors}
        stroke-linecap="round"
        stroke-width={strokeWidth}
        stroke-dasharray={pathLength}
        stroke-dashoffset={linearEase(elapsedTime, 0, pathLength, duration)}
    />
    </svg>
    <slot remainingTime={remainingTime} />
</div>
