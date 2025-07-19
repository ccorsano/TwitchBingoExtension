<script lang="ts">
	interface Props {
		style?: string;
	}

	let { style = "" }: Props = $props();
</script>

<style lang="scss">
    @use './LinearIndeterminateLoader.scss'
</style>

<div class="linear-indeterminate-loader" style={style} ></div>