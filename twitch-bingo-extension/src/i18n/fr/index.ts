import type { BaseTranslation } from 'typesafe-i18n'

const fr: BaseTranslation = {
	Mobile:{
		ConfirmButton: "Confirmer",
		CancelButton: "Annuler",
	},
	OverlayBingoGrid: {
		WaitingMessage: "En attente du début de partie !"
	},
	BingoViewerEntry:{
		ConfirmButtonLabel: "Confirmer",
	},
	BingoModeration:{
		ConfirmButtonLabel: "Confirmer",
		ConfirmButton: "Confirmer",
		NoEntriesMessage: "Aucune entrée configuré.",
	},
	Config:{
		ConfigureGrid: 'Configurer la grille',
		Columns: 'Colonnes',
		Rows: 'Lignes',
		AlertNotEnoughEntriesToFillTheGrid: 'Pas assez d\'entrées pour remplir la grille !',
		AddEntriesOrReduceGridDimensionsToStartTheGame: 'Ajoutez des entrées ou réduisez les dimensions pour pouvoir démarrer la partie.',
		ConfirmationTime: 'Délai de confirmation (en minutes)',
		SaveGame: 'Sauvegarder',
		StartGame: 'Démarrer',
		LibraryEditor:{
			Title: "Bibliothèque",
			TitleSubHeader: "Chargez ou ajoutez toutes vos entrées de bingo ici.",
			UploadButtonLabel: "Charger une liste d'entrées",
			UploadButtonTitle: "Remplacer les entrées en uploadant un fichier .txt",
			CopyEntriesButtonLabel: "Copier les entrées vers le presse-papier",
			CopyEntriesButtonTitle: "Copier les entrées vers le presse-papier",
			AddEntryButtonLabel: "Ajouter une nouvelle entrée à la liste",
			AddEntryButtonTitle: "Ajouter une nouvelle entrée à la liste",
		},
		StatusCard: {
			Title: "Status",
			StatusActive: "Partie en cours",
			StatusInactive: "Inactif",
			StopButton: "Arrêter la partie",
		},
		EntrySelectionView: {
			Title: "Sélection",
			TitleSubHeader: "Entrées actuellement sélectionnées pour la prochaine partie.",
			NoItemMessage: "Aucune entrée sélectionnée",
		},
		EditableBingoEntry: {
			TextFieldLabel: "Proposition de Bingo",
			TextFieldPlaceholder: "Proposition",
		}
	},
}

export default fr
