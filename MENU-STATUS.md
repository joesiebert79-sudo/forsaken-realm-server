# Forsaken Realm v0.82 menu and HUD update

All six approved menu screens use the recovered original reference layouts: Start, Play, Character Creation, Store, Settings and Credits. The clean castle backdrop and Forsaken Realm name/icon remain. Original pictures are preserved under references/day8-approved; the recovered archive labels these Day 8. DAY4-STATUS.md describes the separate gameplay scope.

Play shows one actual saved survivor, equipment slots, account coins and real companion. Creation shows supported appearance choices and roles, the actual server starting kit and companion, then reviews the faction's real spawn town before sending createCharacter. Android Back returns from review to choices without creating a character. Existing legacy roles and equipment remain intact. New roles remain Farmer and Hunter; placeholder extra slots, roles, example prices and cash checkout in the pictures are not invented game data. Character modeling is not part of this release.

Settings and the control editor use an actual captured isometric game scene. The editor has Default/MOBA, Left Handed, Compact and Large Buttons presets; drag/resize; reset; Apply and Cancel. Only Apply persists the draft. Existing layouts remain until changed. No staged blacksmith scene replaces the live preview.

The local survivor's health follows its head as the camera pans/zooms, with extra clearance for mounted riders and clan labels. The large fixed bottom health panel is replaced; the small portrait HUD remains. The belt coin pouch occupies the backpack top header rather than overlapping the character panel heading.

Blacksmith buttons are Weapons, Armor, Shields and Tools when stocked. The inn has Food. Provisioners have Supplies and Materials when stocked. All category buttons derive from that merchant's actual offers, and empty/unrelated categories are hidden. Trader confirmations now correctly explain the existing 10:1 conversion.

The stocked market, furnishing kits, value-preserving coin exchange, prior combat/backpack/base fixes, smaller world and working updater are retained. The matching Windows server remains v0.80; no server replacement is required for the app-only changes.

Validation: pure Java checks for category filtering, preset persistence and overlap at 16:9 and wide phone sizes, overhead health pan/zoom/mount/label anchoring; actual menu drawing and touch handlers exercised with desktop adapters, including navigation and character creation confirmation; signed Android build; supported server regression suite. Desktop layout previews use graphics/model adapters and are not physical-phone captures. Final phone testing remains with the player.
