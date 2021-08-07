import type { BaseTranslation } from 'typesafe-i18n'

const en: BaseTranslation = {
	Mobile:{
		ConfirmButton: "Confirm",
		CancelButton: "Cancel",
		MissedLabel: "Missed",
		PendingLabel: "Pending",
	},
	OverlayBingoGrid: {
		WaitingMessage: "Waiting for the game to start !"
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
		ConfirmationTime: 'Confirmation time (in minutes)',
		SaveGame: 'Save',
		StartGame: 'Start',
		LibraryEditor:{
			Title: "Library",
			TitleSubHeader: "Load or add all your bingo entries here.",
			UploadButtonLabel: "Upload entry list",
			UploadButtonTitle: "Replace entries by uploading a .txt file",
			CopyEntriesButtonLabel: "Copy current entries to your pasteboard",
			CopyEntriesButtonTitle: "Copy current entries to your pasteboard",
			AddEntryButtonLabel: "Add a new entry to the list",
			AddEntryButtonTitle: "Add a new entry to the list",
		},
		StatusCard: {
			Title: "Status",
			StatusActive: "Active",
			StatusInactive: "Inactive",
			StopButton: "Stop game",
		},
		EntrySelectionView: {
			Title: "Selection",
			TitleSubHeader: "These are the bingo entries currently selected for the next game.",
			NoItemMessage: "No items selected",
		},
		EditableBingoEntry: {
			TextFieldLabel: "Bingo proposition",
			TextFieldPlaceholder: "Proposition",
		}
	},
}

export default en
