import treeService from "./services/tree.js";
import treeCache from "./services/tree_cache.js";
import treeBuilder from "./services/tree_builder.js";
import contextMenuWidget from "./services/context_menu.js";
import branchService from "./services/branches.js";
import utils from "./services/utils.js";
import appContext from "./services/app_context.js";
import noteCreateService from "./services/note_create.js";
import glob from "./services/glob.js";

const $leftPane = $("#left-pane");
const $tree = $("#tree");
const $detail = $("#detail");

function togglePanes() {
    if (!$leftPane.is(":visible") || !$detail.is(":visible")) {
        $detail.toggleClass("d-none");
        $leftPane.toggleClass("d-none");
    }
}

function showDetailPane() {
    if (!$detail.is(":visible")) {
        $detail.removeClass("d-none");
        $leftPane.addClass("d-none");
    }
}

$detail.on("click", ".close-detail-button",() => {
    // no page is opened
    document.location.hash = '-';

    togglePanes();
});

async function showTree() {
    const treeData = await treeBuilder.prepareTree();

    $tree.fancytree({
        autoScroll: true,
        extensions: ["dnd5", "clones"],
        source: treeData,
        scrollParent: $tree,
        minExpandLevel: 2, // root can't be collapsed
        click: (event, data) => {
            if (data.targetType !== 'expander' && data.node.isActive()) {
                // this is important for single column mobile view, otherwise it's not possible to see again previously displayed note
                $tree.fancytree('getTree').reactivate(true);

                return false;
            }
        },
        activate: async (event, data) => {
            const node = data.node;

            treeService.clearSelectedNodes();

            showDetailPane();

            const notePath = await treeService.getNotePath(node);

        },
        expand: (event, data) => treeService.setExpandedToServer(data.node.data.branchId, true),
        collapse: (event, data) => treeService.setExpandedToServer(data.node.data.branchId, false),
        init: (event, data) => treeService.treeInitialized(), // don't collapse to short form
        dnd5: dragAndDropSetup,
        lazyLoad: function(event, data) {
            const noteId = data.node.data.noteId;

            data.result = treeCache.getNote(noteId).then(note => treeBuilder.prepareBranch(note));
        },
        clones: {
            highlightActiveClones: true
        },
        // this is done to automatically lazy load all expanded search notes after tree load
        loadChildren: (event, data) => {
            data.node.visit((subNode) => {
                // Load all lazy/unloaded child nodes
                // (which will trigger `loadChildren` recursively)
                if (subNode.isUndefined() && subNode.isExpanded()) {
                    subNode.load();
                }
            });
        }
    });

    treeService.setTree($.ui.fancytree.getTree("#tree"));
}

$("#log-out-button").on('click', () => {
    $("#logout-form").trigger('submit');
});

// this is done so that startNotePath is not used
if (!document.location.hash) {
    document.location.hash = '-';
}

showTree();