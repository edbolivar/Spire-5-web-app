/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   paper-dialog-scrollable.html
 */

/// <reference path="../polymer/types/polymer.d.ts" />
/// <reference path="../iron-flex-layout/iron-flex-layout.d.ts" />
/// <reference path="../paper-dialog-behavior/paper-dialog-behavior.d.ts" />
/// <reference path="../paper-styles/default-theme.d.ts" />

/**
 * Material design: [Dialogs](https://www.google.com/design/spec/components/dialogs.html)
 *
 * `paper-dialog-scrollable` implements a scrolling area used in a Material Design dialog. It shows
 * a divider at the top and/or bottom indicating more content, depending on scroll position. Use this
 * together with elements implementing `Polymer.PaperDialogBehavior`.
 *
 *     <paper-dialog-impl>
 *       <h2>Header</h2>
 *       <paper-dialog-scrollable>
 *         Lorem ipsum...
 *       </paper-dialog-scrollable>
 *       <div class="buttons">
 *         <paper-button>OK</paper-button>
 *       </div>
 *     </paper-dialog-impl>
 *
 * It shows a top divider after scrolling if it is not the first child in its parent container,
 * indicating there is more content above. It shows a bottom divider if it is scrollable and it is not
 * the last child in its parent container, indicating there is more content below. The bottom divider
 * is hidden if it is scrolled to the bottom.
 *
 * If `paper-dialog-scrollable` is not a direct child of the element implementing `Polymer.PaperDialogBehavior`,
 * remember to set the `dialogElement`:
 *
 *     <paper-dialog-impl id="myDialog">
 *       <h2>Header</h2>
 *       <div class="my-content-wrapper">
 *         <h4>Sub-header</h4>
 *         <paper-dialog-scrollable>
 *           Lorem ipsum...
 *         </paper-dialog-scrollable>
 *       </div>
 *       <div class="buttons">
 *         <paper-button>OK</paper-button>
 *       </div>
 *     </paper-dialog-impl>
 *
 *     <script>
 *       var scrollable = Polymer.dom(myDialog).querySelector('paper-dialog-scrollable');
 *       scrollable.dialogElement = myDialog;
 *     </script>
 *
 * ### Styling
 * The following custom properties and mixins are available for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--paper-dialog-scrollable` | Mixin for the scrollable content | {}
 */
interface PaperDialogScrollableElement extends Polymer.Element {

  /**
   * The dialog element that implements `Polymer.PaperDialogBehavior`
   * containing this element.
   */
  dialogElement: Node|null;

  /**
   * Returns the scrolling element.
   *      
   */
  readonly scrollTarget: any;
  ready(): void;
  attached(): void;
  updateScrollState(): void;
  _ensureTarget(): void;
}

interface HTMLElementTagNameMap {
  "paper-dialog-scrollable": PaperDialogScrollableElement;
}
