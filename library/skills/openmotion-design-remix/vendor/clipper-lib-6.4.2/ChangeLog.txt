============================================================
Javascript Clipper Change Log
============================================================

v6.4.2.2 (8 September 2017)
* Added ClipperLib.version, which returns "6.4.2.2".
* Main Demo -updates:
  - Main Demo is made to support IntPoint and FPoint version of 
  Javascript Clipper.
  - Benchmark is now more complete. Nearly all possible combinations
  of various properties are covered. A new Random Benchmark is added,
  which covers Random Rectangles, Random Polygons and Random Grid -
  polygon types.
  - Polygons in Preview-window are now hoverable and clickable.
  - Polygon explorer shows now the clicked polygon in red color.

v6.4.2.1 (3 September 2017)
* Speedup: Overloading techique is changed regarding functions IntPoint,
  DoublePoint and SlopesEqual. This reduced execution time of intersection
  operation from 101 ms to 69 ms in solutions with 10k+ vertices.
  
* Several bugfixes:
  #12 Union of polygons with colinear edges (2)
  #16 horizontal end segment of an open path gets reversed.
  #17	ClipperLib.JS.Lighten always returns a Paths
  #18	TypeError: this.ParseFirstLeft is not a function
  #19	ir is not defined
  #20	Undesired zero width bridge when performing difference operation

* Updates from C# Clipper v6.4.2 (27 February 2017) Rev 512:
  - Several minor bugfixes: #152 #160 #161 #162 

* Updates from C# Clipper v6.4 (2 July 2015) Rev 495:
  - Numerous generally minor bugfixes 

v6.2.1.2 (27 November 2016)
* use_xyz directive changed to ClipperLib.use_xyz and use_lines 
  directive changed to ClipperLib.use_lines, so they can be set
  runtime.
* use_int32 removed, because in Javascript there is no such integer.
* When copying IntPoints, Z-member was missing when use_xyz is true.

v6.2.1.1 (19 November 2016)
* Line 3282: Changed ZFillFunction to this.ZFillFunction.

v6.2.1.0 (17 June 2016)
* Updates from C# Clipper upto 6.2.1 Rev 482 (31 October 2014).

  * Updates from C# Clipper v6.2.1 (31 October 2014) Rev 482:
  - Bugfix in ClipperOffset.Execute where the Polytree.IsHole property 
    was returning incorrect values with negative offsets
  - Very minor improvement to join rounding in ClipperOffset

  * Updates from C# Clipper v6.2.0 (17 October 2014) Rev 477:
  - Numerous minor bugfixes, too many to list. 
    (See revisions 454-475 in Sourceforge Repository)
  - The ZFillFunction (custom callback function) has had its parameters 
    changed. 
  - Deprecated functions have been removed. 

  * Updates from C# Clipper v6.1.5 (26 February 2014) Rev 460
  - Improved the joining of output polygons sharing a common edge 
    when those common edges are horizontal.
  - Fixed a bug in ClipperOffset.AddPath() which would produce
    incorrect solutions when open paths were added before closed paths.
  - Minor code tidy and performance improvement

  * Updates from C# Clipper v6.1.4 (6 February 2014)
  - Fixed bugs in MinkowskiSum
  - Fixed minor bug when using Clipper.ForceSimplify.
  - Modified use_xyz callback so that all 4 vertices around an
  intersection point are now passed to the callback function.

v6.1.3.2 (1 February 2014)
* Update: Unnecessary closures removed around ref/out calls and major
  speedup and code cleanliness achieved. Intersection operation speedup 
  in newest Chrome is 2.3x (from 2530 ms to 1107 ms) and in newest 
  Firefox 1.7x (from 7186 ms to 4164 ms).

v6.1.3.1 (21 January 2014)
* Fixed potential endless loop condition when adding open 
  paths to Clipper.
* Added PointInPolygon function.
* Overloaded MinkowskiSum function to accommodate multi-contour 
  paths.
  
v6.1.2.1 (15 December 2013)
* Minor improvement to joining polygons.

v6.1.1.1 (13 December 2013)
* Fixed a couple of bugs affecting open paths that could 
  raise unhandled exceptions.
* Fixed Uncaught ReferenceError: DistanceFromLineSqrd is not defined when
  using CleanPolygon or CleanPolygons
* Fixed SimplifyPolygon calls in Main Demo

v6.1.0.1 (12 December 2013)
* Added: Info and Examples page: http://jsclipper.sourceforge.net/6.1.0.1/
* Added: Clipper 6 documentation in 
  https://sourceforge.net/p/jsclipper/wiki/documentation/
* Migration guide for Clipper 5 users in
  https://sourceforge.net/p/jsclipper/wiki/migration5to6/
* Modified: To accommodate open paths, several functions have been renamed:
  Polygon -> Path
  Polygons -> Paths
  AddPolygon -> AddPath
  AddPolygons -> AddPaths
  PolyTreeToPolygons -> PolyTreeToPaths
  ReversePolygons -> ReversePaths
* Modified: OffsetPolygons function is replaced by ClipperOffset
  class, which is much more flexible. There is also now deprecated
  OffsetPaths function, which may be removed in future update.
* Update: ExPolygons has been replaced with the PolyTree & 
  PolyNode classes to more fully represent the parent-child 
  relationships of the polygons returned by Clipper. There is 
  for backward compatibility ClipperLib.JS.PolyTreeToExPolygons.
* Added: Open path (polyline) clipping.
* Update: Major improvement in the merging of 
  shared/collinear edges in clip solutions (see Execute). 
* Added: The IntPoint structure now has an optional 'Z' member. 
  (See the precompiler directive use_xyz.) 
* Added: New CleanPolygon and CleanPolygons functions.
* Added: MinkowskiSum and MinkowskiDiff functions added. 
* Added: Several other new functions have been added including 
  PolyTreeToPaths, OpenPathsFromPolyTree and ClosedPathsFromPolyTree. 
* Added: ReverseSolution, PreserveCollinear and StrictlySimple properties to Clipper class
* Added: The Clipper constructor now accepts an optional InitOptions 
  parameter to simplify setting properties. 
* Modified: The Clipper class has a new ZFillFunction property. 
* Deprecated: Version 6 is a major upgrade from previous versions 
  and quite a number of changes have been made to exposed structures 
  and functions. To minimize inconvenience to existing library users, 
  some code has been retained and some added to maintain backward 
  compatibility. However, because this code will be removed in a 
  future update, it has been marked as deprecated and a precompiler 
  directive use_deprecated has been defined.
* Changed: The behaviour of the 'miter' JoinType has been 
  changed so that when squaring occurs, it's no longer 
  extended up to the miter limit but is squared off at 
  exactly 'delta' units. (This improves the look of mitering 
  with larger limits at acute angles.) 
* Bugfixes: Several minor bugs have been fixed including 
  occasionally an incorrect nesting within the PolyTree structure.

5.0.2.3 - 27 November 2013
* Added: Node.js compatibility.
* Bugfix: jQuery's "event.returnValue is deprecated." warning is stripped.

5.0.2.2 - 11 September 2013
* Bugfix: SlopesEqual() uses now big integers only when needed and causes speed improvements in certain cases.
* Bugfix: Fixed inconsistent use of DV in jsbn.js, in function bnpFromInt() DV replaced with this.DV.
* BugFix: ExPolygons structure is now working as expected.
* Added: Main Demo has now Ex-button in Polygon Explorer, which shows Solution as ExPolygons structure.
* Added: ExPolygons is now explained in wiki in https://sourceforge.net/p/jsclipper/wiki/ExPolygons/
* Added: Web Workers compatibility
* Added: Web Workers support page is available in https://sourceforge.net/p/jsclipper/wiki/Web%20Workers/

5.0.2.1 - 12 January 2013
* Update: Clipper library updated to version 5.0.2. The Area algorithm has been updated and is faster. 
  'CheckInputs' parameter of the OffsetPolygons function has been renamed 'AutoFix'.
* Added: ClipperLib.Clean(), which removes too near vertices to avoid micro-self-intersection-artifacts when offsetting.
* Added: ClipperLib.Lighten(), which reduces count of vertices using perpendicular distance reduction algorithm.
* Added: ClipperLib.Clone(), which make true clone of polygons.
Several updates to the Main Demo:
* Added: Clean, Simplify, Lighten buttons
* Change: Custom Polygons: input boxes to textareas to allow more data
* Added: Polygon Output Formats (Clipper, Plain, SVG)
* Update: Polygon Explorer: Also multipolygon is clickable (on Points column) 
* Added: Polygon Explorer: When numbers on Points or Points in subpolygons are clicked, the area of multipolygon or subpolygon is shown
* Update: Several updates to wiki in https://sourceforge.net/p/jsclipper/wiki/Home/

4.9.7.2 - 1 January 2013
* Update: Browser specific speedup for ClipperLib.Clipper.Round(), ClipperLib.Cast_Int32() and ClipperLib.Cast_Int64().
* Update: Major enhancements for Main Demo. Including benchmark, custom polygons and polygon importer.
* Update: Documentation is updated with new screenshots of Main Demo. Browser speedtest is published in Wiki.

4.9.7.1 - 12 December 2012
* Initial release