PH: 05/17/2007: dragdrop.js line 779

- Added block for calculating size of of droppable as content is hovered over it.  Our implementation
of droppables will resize all droppables to be the same height on a page.  For example, if two droppables
are side by side on a page and one is smaller than the other, a drag/drop action will cause the smaller
droppable to grow to the size of the larger one.

The side-effect is that the droppables end up with fixed heights, so the scriptaculous code needs
to be modified to detect fixed heights and expand a droppable when new content is added into it.


PH: 05/17/2007 dragdrop.js line 269 & 239
Bug #974
- Turning off opacity on the drag start and end actions on IE 6 and IE 7 so that the 
text does not get screwed up.

DLC: scriptaculous.js line 46-48
- Added code to handle a request of 'scriptaculous.js?load=' as the equivalent
  of not specifying a load parameter.  We will load the additional scriptaculous
  js files by hand so that we can append a revision number to them to force
  loading new versions.

  
PH: 02/13/2008 dragdrop.js line 261, 277, 655, 670
- Bug 2120 - IE6 will flash the page quickly when you drag an item that has a select
box in it.  The solution to this is to just find the inner div and hide it when it moves.

KG: 04/12/2008 controls.js lines 156-164
- Added an optional callback that will get called when the input text has changed
  (not called when something happens on the suggest div or if tab or enter is pressed)
  This allows us to invalidate the previous selection (if any) in the hidden fields
  since the text has changed.
