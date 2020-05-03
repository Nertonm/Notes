import treeService from './tree.js';
import treeCache from "./tree_cache.js";
import hoistedNoteService from './hoisted_note.js';
import clipboard from './clipboard.js';
import protectedSessionHolder from "./protected_session_holder.js";
import appContext from "./app_context.js";
import noteCreateService from "./note_create.js";
import contextMenu from "./context_menu.js";

class TreeContextMenu {
    /**
     * @param {NoteTreeWidget} treeWidget
     * @param {FancytreeNode} node
     */
    constructor(treeWidget, node) {
        this.treeWidget = treeWidget;
        this.node = node;
    }
    
    async show(e) {
        contextMenu.show({
            x: e.pageX,
            y: e.pageY,
            items: await this.getMenuItems(),
            selectMenuItemHandler: (item, e) => this.selectMenuItemHandler(item, e)
        })
    }

    getNoteTypeItems(command) {
        return [
            { title: "Text", command: command, type: "text", uiIcon: "note" },
            { title: "Code", command: command, type: "code", uiIcon: "code" },
            { title: "Saved search", command: command, type: "search", uiIcon: "file-find" },
            { title: "Relation Map", command: command, type: "relation-map", uiIcon: "map-alt" },
            { title: "Render HTML note", command: command, type: "render", uiIcon: "extension" },
            { title: "Book", command: command, type: "book", uiIcon: "book" }
        ];
    }

    async getMenuItems() {
        const note = await treeCache.getNote(this.node.data.noteId);
        const branch = treeCache.getBranch(this.node.data.branchId);
        const isNotRoot = note.noteId !== 'root';
        const isHoisted = note.noteId === hoistedNoteService.getHoistedNoteId();
        const parentNote = isNotRoot ? await treeCache.getNote(branch.parentNoteId) : null;

        // some actions don't support multi-note so they are disabled when notes are selected
        // the only exception is when the only selected note is the one that was right-clicked, then
        // it's clear what the user meant to do.
        const selNodes = this.treeWidget.getSelectedNodes();
        const noSelectedNotes = selNodes.length === 0
                || (selNodes.length === 1 && selNodes[0] === this.node);

        const notSearch = note.type !== 'search';
        const parentNotSearch = !parentNote || parentNote.type !== 'search';
        const insertNoteAfterEnabled = isNotRoot && !isHoisted && parentNotSearch;

        return [
            { title: 'Open in a new tab <kbd>Ctrl+Click</kbd>', command: "openInTab", uiIcon: "empty", enabled: noSelectedNotes },
            { title: 'Open in a new window', command: "openInWindow", uiIcon: "empty", enabled: noSelectedNotes },
            { title: 'Insert note after <kbd data-command="createNoteAfter"></kbd>', command: "insertNoteAfter", uiIcon: "plus",
                items: insertNoteAfterEnabled ? this.getNoteTypeItems("insertNoteAfter") : null,
                enabled: insertNoteAfterEnabled && noSelectedNotes },
            { title: 'Insert child note <kbd data-command="createNoteInto"></kbd>', command: "insertChildNote", uiIcon: "plus",
                items: notSearch ? this.getNoteTypeItems("insertChildNote") : null,
                enabled: notSearch && noSelectedNotes },
            { title: 'Delete <kbd data-command="deleteNotes"></kbd>', command: "deleteNotes", uiIcon: "trash",
                enabled: isNotRoot && !isHoisted && parentNotSearch },
            { title: "----" },
            { title: 'Search in subtree <kbd data-command="searchInSubtree"></kbd>', command: "searchInSubtree", uiIcon: "search",
                enabled: notSearch && noSelectedNotes },
            isHoisted ? null : { title: 'Hoist note <kbd data-command="toggleNoteHoisting"></kbd>', command: "toggleNoteHoisting", uiIcon: "empty", enabled: noSelectedNotes && notSearch },
            !isHoisted || !isNotRoot ? null : { title: 'Unhoist note <kbd data-command="ToggleNoteHoisting"></kbd>', command: "toggleNoteHoisting", uiIcon: "arrow-up" },
            { title: 'Edit branch prefix <kbd data-command="editBranchPrefix"></kbd>', command: "editBranchPrefix", uiIcon: "empty",
                enabled: isNotRoot && parentNotSearch && noSelectedNotes},
            { title: "Advanced", uiIcon: "empty", enabled: true, items: [
                    { title: 'Expand subtree <kbd data-command="expandSubtree"></kbd>', command: "expandSubtree", uiIcon: "expand", enabled: noSelectedNotes },
                    { title: 'Collapse subtree <kbd data-command="collapseSubtree"></kbd>', command: "collapseSubtree", uiIcon: "collapse", enabled: noSelectedNotes },
                    { title: "Force note sync", command: "forceNoteSync", uiIcon: "refresh", enabled: noSelectedNotes },
                    { title: 'Sort alphabetically <kbd data-command="sortChildNotes"></kbd>', command: "sortChildNotes", uiIcon: "empty", enabled: noSelectedNotes && notSearch },
                    { title: 'Recent changes in subtree', command: "recentChangesInSubtree", uiIcon: "history", enabled: noSelectedNotes }
                ] },
            { title: "----" },
            { title: "Protect subtree", command: "protectSubtree", uiIcon: "check-shield", enabled: noSelectedNotes },
            { title: "Unprotect subtree", command: "unprotectSubtree", uiIcon: "shield", enabled: noSelectedNotes },
            { title: "----" },
            { title: 'Copy / clone <kbd data-command="copyNotesToClipboard"></kbd>', command: "copyNotesToClipboard", uiIcon: "copy",
                enabled: isNotRoot && !isHoisted },
            { title: 'Clone to ... <kbd data-command="cloneNotesTo"></kbd>', command: "cloneNotesTo", uiIcon: "empty",
                enabled: isNotRoot && !isHoisted },
            { title: 'Cut <kbd data-command="cutNotesToClipboard"></kbd>', command: "cutNotesToClipboard", uiIcon: "cut",
                enabled: isNotRoot && !isHoisted && parentNotSearch },
            { title: 'Move to ... <kbd data-command="moveNotesTo"></kbd>', command: "moveNotesTo", uiIcon: "empty",
                enabled: isNotRoot && !isHoisted && parentNotSearch },
            { title: 'Paste into <kbd data-command="pasteNotesFromClipboard"></kbd>', command: "pasteNotesFromClipboard", uiIcon: "paste",
                enabled: !clipboard.isClipboardEmpty() && notSearch && noSelectedNotes },
            { title: 'Paste after', command: "pasteNotesAfterFromClipboard", uiIcon: "paste",
                enabled: !clipboard.isClipboardEmpty() && isNotRoot && !isHoisted && parentNotSearch && noSelectedNotes },
            { title: "Duplicate note here", command: "duplicateNote", uiIcon: "empty",
                enabled: noSelectedNotes && parentNotSearch && isNotRoot && !isHoisted && (!note.isProtected || protectedSessionHolder.isProtectedSessionAvailable()) },
            { title: "----" },
            { title: "Export", command: "exportNote", uiIcon: "empty",
                enabled: notSearch && noSelectedNotes },
            { title: "Import into note", command: "importIntoNote", uiIcon: "empty",
                enabled: notSearch && noSelectedNotes }
        ].filter(row => row !== null);
    }

    async selectMenuItemHandler({command, type}) {
        const noteId = this.node.data.noteId;
        const notePath = treeService.getNotePath(this.node);

        if (command === 'openInTab') {
            appContext.tabManager.openTabWithNote(notePath);
        }
        else if (command === 'openInWindow') {
            appContext.openInNewWindow(notePath);
        }
        else if (command === "insertNoteAfter") {
            const parentNoteId = this.node.data.parentNoteId;
            const isProtected = await treeService.getParentProtectedStatus(this.node);

            noteCreateService.createNote(parentNoteId, {
                target: 'after',
                targetBranchId: this.node.data.branchId,
                type: type,
                isProtected: isProtected
            });
        }
        else if (command === "insertChildNote") {
            noteCreateService.createNote(noteId, {
                type: type,
                isProtected: this.node.data.isProtected
            });
        }
        else {
            this.treeWidget.triggerCommand(command, {node: this.node});
        }
    }
}

export default TreeContextMenu;