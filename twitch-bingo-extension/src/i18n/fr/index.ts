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
		ConfirmedLabel: "Confirmé",
		ConfirmedByMessage: "Confirmé {confirmedAt} par {confirmedBy}",
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
			TitleSubHeader: "Chargez, collez ou ajoutez toutes vos entrées de bingo ici.",
			MessageNoItems: "Aucune entrée dans le Bingo, ajoutez-en !",
			UploadButtonLabel: "Charger une liste d'entrées",
			UploadButtonTitle: "Remplacer les entrées en uploadant un fichier .txt",
			AddEntryButtonLabel: "Ajouter une entrée",
			AddEntryButtonTitle: "Ajouter une nouvelle entrée à la liste",
			CopyEntriesToPasteboardLabel: "Copier les entrées",
			CopyEntriesToPasteboardTitle: "Copier les entrées dans le presse-papier",
		},
		StatusCard: {
			Title: "Status",
			StatusActive: "Partie en cours",
			StatusInactive: "Inactif",
			StopButton: "Arrêter la partie",
			LoadingConfiguration: "Chargement de la configuration ...",
		},
		GameLog: {
			Header: "Journal de la partie",
			StartedGameText: "Partie démarrée !",
			ConfirmationText: "#{entryKey} {entryText} confirmé par {playerNames}",
			CompletedColText: "#{entryKey} a complété une colonne pour {playersCount} joueurs",
			CompletedRowText: "#{entryKey} a complété une ligne pour {playersCount} joueurs",
			CompletedGridText: "#{entryKey} a complété la grille pour {playersCount} joueurs",
		},
		EntrySelectionView: {
			Title: "Sélection",
			TitleSubHeader: "Entrées actuellement sélectionnées pour la prochaine partie.",
			NoItemMessage: "Aucune entrée sélectionnée",
		},
		EditableBingoEntry: {
			TextFieldLabel: "Proposition de Bingo",
			TextFieldPlaceholder: "Proposition",
			DeleteLabel: "Supprimer la proposition",
			DeleteLabelCantRemove: "Impossible de supprimer une proposition sélectionnée",
			AddSelectionLabel: "Ajouter à la sélection",
			EditLabel: "Editer la proposition",
		},
		DeactivateChatIntegrationTitle: "L'intégration au chat est active",
		DeactivateChatIntegrationText: "Vous pouvez désactiver l'intégration au chat en allant sur votre panneau “Mes extensions” puis en cliquant sur “Gérer les autorisations”.",
		ActivateChatIntegrationTitle: "L'intégration au chat est inactive",
		ActivateChatIntegrationText: "Vous pouvez activer l'intégration au chat en allant sur votre panneau “Mes extensions” puis en cliquant sur “Gérer les autorisations”.",
	},
}

export default fr
