import type { Translation } from '../i18n-types'

const fr: Translation = {
	Mobile:{
		ConfirmButton: "Confirmer",
		CancelButton: "Annuler",
		MissedLabel: "Manqué",
		PendingLabel: "En Attente",
	},
	OverlayBingoGrid: {
		WaitingMessage: "En attente du début de partie !",
		IdentityPromptMessage: "Pour rejoindre la partie et obtenir votre propre grille de Bingo, vous devez partager votre nom d'utilisateur Twitch avec l'extension.",
		ShareIdentityButtonLabel: "Partager"
	},
	BingoViewerEntry:{
		ConfirmButtonLabel: "Confirmer",
		MissedRibbonLabel: "Manqué",
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
		ConfirmationTime: 'Délai de confirmation',
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
