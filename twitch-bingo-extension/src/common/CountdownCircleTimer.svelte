<script lang="ts">
    import { run } from 'svelte/legacy';

    import { onMount } from "svelte";

    type OnComplete = {
        /** Indicates if the loop should start over. Default: false */
        shouldRepeat?: boolean
        /** Delay in seconds before looping again. Default: 0 */
        delay?: number
        /** Set new initial remaining when starting over the animation */
        newInitialRemainingTime?: number
    }

    interface Props {
        size?: number;
        duration: number;
        colors: string;
        strokeWidth?: number;
        trailColor?: string | undefined;
        trailStrokeWidth?: number | undefined;
        isPlaying?: boolean;
        rotation?: string;
        onComplete?: ((totalElapsedTime: number) => OnComplete | void) | undefined;
        onUpdate?: ((remainingTime: number) => void) | undefined;
        children?: import('svelte').Snippet;
    }

    let {
        size = 180,
        duration,
        colors,
        strokeWidth = 12,
        trailColor = undefined,
        trailStrokeWidth = undefined,
        isPlaying = $bindable(false),
        rotation = "clockwise",
        onComplete = undefined,
        onUpdate = undefined,
        children
    }: Props = $props();
    

    const halfSize = size / 2
    const halfStrokeWith = strokeWidth / 2
    const arcRadius = halfSize - halfStrokeWith
    const arcDiameter = 2 * arcRadius
    const rotationIndicator = rotation === 'clockwise' ? '1,0' : '0,1'

    const pathLength = 2 * Math.PI * arcRadius
    const path = `m ${halfSize},${halfStrokeWith} a ${arcRadius},${arcRadius} 0 ${rotationIndicator} 0,${arcDiameter} a ${arcRadius},${arcRadius} 0 ${rotationIndicator} 0,-${arcDiameter}`

    let elapsedTime:number = $state(0.0)
    let startTime:number|undefined = $state(undefined)

    function linearEase(time: number, start: number, goal: number, duration:number)
    {
        if (duration === 0) {
            return start
        }
        const currentTime = time / duration
        return start + goal * currentTime
    }

    run(() => {
        if (isPlaying && startTime === undefined)
        {
            startTime = Date.now()
        }
    });

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
                    onUpdate(elapsedTime ?? 0.0)
                }
                if (elapsedTime >= duration)
                {
                    if (onComplete)
                    {
                        onComplete(elapsedTime)
                    }
                    elapsedTime = 0.0
                    isPlaying = false
                }
            }
        }, 100);

        return () => clearInterval(interval)
    })
</script>

<style lang="scss">
    .time-style {
        overflow: hidden;
        display: flex;
        white-space: nowrap;
        text-overflow: ellipsis;
        justify-content: center;
        align-items: center;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        flex-wrap: nowrap;
    }
</style>

<div style:position="relative" style:width={size} style:height={size}
     style:box-sizing="border-box" style:overflow="hidden">
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
    <div class="time-style" style:max-height={size}>
        {@render children?.()}
    </div>
</div>
