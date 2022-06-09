import type { BaseTranslation } from '../i18n-types'

const en: BaseTranslation = {
	Mobile:{
		ConfirmButton: "Confirm",
		CancelButton: "Cancel",
		MissedLabel: "Missed",
		PendingLabel: "Pending",
	},
	OverlayBingoGrid: {
		WaitingMessage: "Waiting for the game to start !",
		IdentityPromptMessage: "In order to join the game and get your own Bingo grid, you need to share your Twitch username with the extension.",
		ShareIdentityButtonLabel: "Share"
	},
	BingoViewerEntry:{
		ConfirmButtonLabel: "Confirm",
		MissedRibbonLabel: "Missed",
	},
	BingoModeration:{
		ConfirmButtonLabel: "Confirm",
		ConfirmButton: "Confirm",
		NoEntriesMessage: "No entries configured.",
	},
	Config:{
		ConfigureGrid: 'Configure Grid',
		Columns: 'Columns',
		Rows: 'Rows',
		AlertNotEnoughEntriesToFillTheGrid: 'Not enough entries to fill the grid !',
		AddEntriesOrReduceGridDimensionsToStartTheGame: 'Add entries or reduce grid dimensions to start the game.',
		ConfirmationTime: 'Confirmation time',
		SaveGame: 'Save',
		StartGame: 'Start',
		LibraryEditor:{
			Title: "Library",
			TitleSubHeader: "Load or add all your bingo entries here.",
			MessageNoItems: "No items in Bingo, go add some !",
			UploadButtonLabel: "Upload entry list",
			UploadButtonTitle: "Replace entries by uploading a .txt file",
			AddEntryButtonLabel: "Add a new entry",
			AddEntryButtonTitle: "Add a new entry to the list",
		},
		StatusCard: {
			Title: "Status",
			StatusActive: "Active",
			StatusInactive: "Inactive",
			StopButton: "Stop game",
			LoadingConfiguration: "Loading configuration ...",
		},
		GameLog: {
			Header: "Game Log",
			StartedGameText: "Game started !",
			ConfirmationText: "#{entryKey} “{entryText}” confirmed by {playerNames}",
			CompletedColText: "#{entryKey} completed columns for {playersCount} players",
			CompletedRowText: "#{entryKey} completed rows for {playersCount} players",
			CompletedGridText: "#{entryKey} completed the grid for {playersCount} players",
		},
		EntrySelectionView: {
			Title: "Selection",
			TitleSubHeader: "These are the bingo entries currently selected for the next game.",
			NoItemMessage: "No items selected",
		},
		EditableBingoEntry: {
			TextFieldLabel: "Bingo proposition",
			TextFieldPlaceholder: "Proposition",
			DeleteLabel: "Delete this entry",
			DeleteLabelCantRemove: "Cannot delete a selected entry",
			AddSelectionLabel: "Add to selection",
			EditLabel: "Edit this entry",
		},
		DeactivateChatIntegrationTitle: "Chat integration is enabled",
		DeactivateChatIntegrationText: "You can disable chat integration by going to your “My Extensions” panel, and clicking “Manage Permissions”.",
		ActivateChatIntegrationTitle: "Chat integration is disabled",
		ActivateChatIntegrationText: "You can allow chat integration by going to your “My Extensions” panel, and clicking “Manage Permissions”.",
	},
}

export default en
