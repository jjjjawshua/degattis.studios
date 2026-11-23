/* degattis studios data: catalogue, Radio editions, journal posts. All concept material — see flags in the UI. */
var CATS = [['all','All'],['carry','Carry'],['jewellery','Jewellery'],['desk','Desk'],['home','Home']];
var FINISHES = [
  {id:'polished', name:'Polished', sw:'linear-gradient(135deg,#fff,#b9bcc4)', color:0xe9eaee, rough:.07, metal:1},
  {id:'brushed', name:'Brushed', sw:'linear-gradient(90deg,#d9dbe0,#aeb2ba,#d9dbe0)', color:0xdcdee3, rough:.3, metal:1},
  {id:'blasted', name:'Bead blasted', sw:'#c9ccd2', color:0xd2d4d9, rough:.58, metal:1},
  {id:'black', name:'Black PVD', sw:'#2b2c31', color:0x2c2d33, rough:.32, metal:.85}
];
var METAL = ['polished','brushed','blasted','black'];
var PRODUCTS = [
  {id:'loop-opener', quips:["Cap off", "Lid flipped", "Mate holds the door", "You hold the bottle", "Nobody holds a grudge"], code:'KR-001', name:'Loop Opener', cat:'carry', price:68, art:{palette:'pool', layout:'column', count:4, seed:61, size:1.4}, finishes:METAL,
   short:'Bottle opener that lives on your keys', copy:'A flat stainless loop that opens bottles and hangs from your keys. The cobalt screw holds a replaceable steel lip, so the edge that does the work can be swapped when it wears.',
   spec:[['Material','316L stainless, 4 mm plate'],['Size','84 × 32 × 4 mm'],['Weight','about 70 g'],['Fastener','M3 × 4 titanium screw, cobalt anodised'],['Process','Waterjet, CNC chamfer, tumbled']], post:'loop-opener-cad'},
  {id:'bolt-ring', quips:["One bolt", "Zero excuses", "Tightened by hand", "Loosened by nobody"], code:'KR-002', name:'Bolt Ring', cat:'jewellery', price:120, art:{palette:'halo', layout:'ring', count:8, seed:4}, finishes:METAL, sizes:['US 6','US 7','US 8','US 9','US 10','US 11','US 12'],
   short:'Heavy band with one hex bolt', copy:'A heavy band with one hex bolt set into the outside, like hardware on a machine. The bolt is the only colour on it, and it sits flush enough to wear every day.',
   spec:[['Material','316L stainless, solid'],['Size','7 mm band, 2.2 mm wall'],['Weight','about 9 g at US 9'],['Fastener','M2 hex bolt, titanium, cobalt anodised'],['Process','CNC turned, hand polished']], post:'one-cobalt-screw'},
  {id:'fold-clip', quips:["Notes in", "Receipts out", "Folded once", "Like your nan's tea towel"], code:'KR-003', name:'Fold Clip', cat:'carry', price:54, art:{palette:'dawn', layout:'grid', count:9, seed:63, streak:.45}, finishes:METAL,
   short:'Money clip folded from one strip', copy:'A money clip folded from one strip of spring steel. A cobalt rivet marks the bend and keeps the tension even from the first note to the twentieth.',
   spec:[['Material','17-7 PH spring stainless, 0.8 mm'],['Size','58 × 20 × 11 mm'],['Weight','about 12 g'],['Fastener','Cobalt anodised aluminium rivet'],['Process','Laser cut, press formed, bead blasted']], post:'why-316l'},
  {id:'key-tag', quips:["One key", "One tag", "One less thing", "To lose down the sofa"], code:'KR-004', name:'Key Tag', cat:'carry', price:42, art:{palette:'cobalt', layout:'scatter', count:6, seed:14}, finishes:METAL,
   short:'Machined tag with a split ring', copy:'A small machined tag for a single key, with a stainless split ring and the cobalt screw you can feel with your thumb in a pocket.',
   spec:[['Material','6061 aluminium, 3 mm'],['Size','50 × 24 × 3 mm'],['Weight','about 9 g'],['Fastener','M2.5 screw, cobalt anodised'],['Process','CNC milled, bead blasted, clear anodised']]},
  {id:'desk-tray', quips:["Keys go here", "Coins go here", "Your ex's hoodie", "Does not go here"], code:'KR-005', name:'Desk Tray', cat:'desk', price:140, art:{palette:'pool', layout:'grid', count:6, seed:70, size:1.2}, finishes:METAL,
   short:'Shallow tray for keys and coins', copy:'A shallow tray for the things in your pockets. Folded walls, a flat floor and two cobalt screws on the rim, which is all the decoration it needs.',
   spec:[['Material','316L stainless, 1.5 mm sheet'],['Size','180 × 110 × 22 mm'],['Weight','about 310 g'],['Fastener','Two M3 screws, cobalt anodised'],['Process','Laser cut, folded, TIG welded corners']]},
  {id:'disc-pendant', quips:["Big washer energy", "Hex in the middle", "Chain round the neck", "Compliments incoming"], code:'KR-006', name:'Disc Pendant', cat:'jewellery', price:95, art:{palette:'halo', layout:'orbit', count:6, seed:15, streak:.22}, finishes:METAL,
   short:'Washer-shaped pendant with a hex centre', copy:'A pendant shaped like an oversized washer, held together by a cobalt hex bolt through the middle. It hangs from a 2 mm box chain.',
   spec:[['Material','316L stainless'],['Size','Ø 38 mm, 4 mm thick'],['Weight','about 22 g'],['Fastener','M4 hex bolt, cobalt anodised'],['Chain','2 mm box chain, 60 cm']]},
  {id:'carabiner', quips:["Not for climbing", "Except the social ladder", "Clip it on", "Clip it off", "Feel important"], code:'KR-007', name:'Carabiner', cat:'carry', price:48, art:{palette:'fig', layout:'column', count:5, seed:17}, finishes:METAL,
   short:'Belt-loop carabiner with a cobalt sleeve', copy:'A flat carabiner for a belt loop or bag strap. The spring gate is wrapped in a cobalt sleeve so you always know which side opens. Not for climbing.',
   spec:[['Material','6061 aluminium, 6 mm'],['Size','62 × 28 × 6 mm'],['Weight','about 14 g'],['Detail','Cobalt anodised gate sleeve'],['Note','Not rated for load']]},
  {id:'ashtray', quips:["Heavy dish", "Light chat", "Ash on the left", "Rings on the right"], code:'KR-008', name:'Ashtray', cat:'desk', price:110, art:{palette:'fig', layout:'ring', count:6, seed:16}, finishes:METAL,
   short:'Turned steel dish with a cobalt rest', copy:'A heavy turned dish for ash, clips or rings. The cobalt bar across the rim is the rest, and the weight keeps it where you put it.',
   spec:[['Material','316L stainless, solid'],['Size','Ø 110 × 24 mm'],['Weight','about 480 g'],['Detail','Cobalt anodised aluminium rest'],['Process','CNC turned, brushed']]},
  {id:'split-ring', quips:["Opens once", "Holds forever", "Thumbnail sold separately"], code:'KR-009', name:'Split Ring', cat:'carry', price:24, art:{palette:'halo', layout:'orbit', count:5, seed:9, streak:.22}, finishes:METAL, build:{type:'band', ri:1.5, ro:1.6, hw:.09, bs:.13, round:true, present:[1.1, .3, 0]},
   short:'Heavy split ring for keys', copy:'A thick stainless split ring that holds a full set of keys without opening up, with a cobalt stop at the seam.', spec:[['Material','17-7 PH spring stainless'],['Size','Ø 32 mm, 2.5 mm wire'],['Weight','about 9 g'],['Detail','Cobalt anodised stop']]},
  {id:'wall-plate', quips:["Hang it straight", "Four blue screws", "Spirit level", "Not included"], code:'KR-010', name:'Wall Plate', cat:'home', price:90, art:{palette:'halo', layout:'ring', count:9, seed:31, size:1.2}, finishes:METAL, build:{type:'plate', shape:'rrect', w:4.2, h:5.94, r:.12, t:.16, screws:[[-1.7, 2.57], [1.7, 2.57], [-1.7, -2.57], [1.7, -2.57]], sr:.18, present:[-.12, -.35, 0]},
   short:'Etched steel plate for the wall', copy:'An A5 steel plate with the Collection 001 artwork etched into it, held off the wall by four cobalt screws.', spec:[['Material','304 stainless, 1.5 mm'],['Size','A5 · 148 × 210 mm'],['Weight','about 360 g'],['Finish','Acid etched, brushed']]},
  /* --- test objects 011–030: concepts generated from adjustable shapes --- */
  {id:'bookmark', quips:["Page ninety-two", "Chapter nine", "Asleep by ten", "Same again tomorrow"], code:'KR-011', name:'Bookmark', cat:'desk', price:28, art:{palette:'pool', layout:'column', count:4, seed:111}, finishes:METAL, build:{type:'plate', shape:'rrect', w:2.2, h:9, r:.5, t:.18, holes:[[0, 3.8, .3]], screws:[[0, -3.4]], sr:.3, present:[-.2, .5, .15]},
   short:'Thin steel bookmark with a blue pin', copy:'A thin stainless bookmark that holds its place without bending the page. The cobalt pin at the foot is the part your thumb finds.', spec:[['Material','316L stainless, 0.8 mm'],['Size','22 × 90 mm'],['Weight','about 12 g'],['Detail','Cobalt anodised pin']]},
  {id:'token', quips:["Heads you win", "Tails you win", "Rigged in your favour"], code:'KR-012', name:'Token', cat:'carry', price:22, art:{palette:'halo', layout:'orbit', count:5, seed:112, streak:.22}, finishes:METAL, build:{type:'plate', shape:'circle', w:3.6, t:.4, screws:[[0, 0]], sr:.55},
   short:'A pocket coin with a cobalt centre', copy:'A heavy steel coin to flip, fidget with or leave on a desk. The cobalt screw in the middle makes it ours.', spec:[['Material','316L stainless, 4 mm'],['Size','Ø 36 mm'],['Weight','about 32 g'],['Detail','Cobalt anodised centre screw']]},
  {id:'coaster', quips:["Rings on the table", "Not on our watch", "Cold drink", "Colder coaster"], code:'KR-013', name:'Coaster', cat:'home', price:45, art:{palette:'dawn', layout:'ring', count:7, seed:113}, finishes:METAL, build:{type:'plate', shape:'circle', w:9, t:.3, screws:[[0, 3.6]], sr:.3, present:[-.9, .2, 0]},
   short:'Brushed steel coaster', copy:'A flat brushed coaster with one cobalt screw at the edge. Heavy enough that a glass never takes it with it.', spec:[['Material','304 stainless, 3 mm'],['Size','Ø 90 mm'],['Weight','about 150 g'],['Detail','Cork base, cobalt screw']]},
  {id:'ruler', quips:["Measure twice", "Cut once", "Lie about it after"], code:'KR-014', name:'Ruler 15', cat:'desk', price:38, art:{palette:'halo', layout:'grid', count:6, seed:114, streak:.4}, finishes:METAL, build:{type:'plate', shape:'rrect', w:15, h:2.6, r:.3, t:.2, holes:[[6.9, 0, .32]], screws:[[-6.6, 0]], sr:.3},
   short:'Etched 15 cm steel ruler', copy:'A 15 cm ruler etched in millimetres, with a hanging hole at one end and a cobalt screw at the other.', spec:[['Material','316L stainless, 1 mm'],['Size','150 × 26 mm'],['Weight','about 30 g'],['Marking','Laser etched, mm and inches']]},
  {id:'bar-opener', quips:["Behind the bar", "Ahead of the queue", "First round's on", "Whoever's slowest"], code:'KR-015', name:'Bar Opener', cat:'carry', price:58, art:{palette:'fig', layout:'column', count:4, seed:115}, finishes:METAL, build:{type:'plate', shape:'rrect', w:10, h:2.6, r:.5, t:.35, slot:[-3.2, 0, 2.4, 1.3], screws:[[2.6, 0]], sr:.38},
   short:'A long bar-style bottle opener', copy:'The bartender version of the Loop Opener: longer, flatter and quicker in the hand.', spec:[['Material','316L stainless, 3.5 mm'],['Size','100 × 26 mm'],['Weight','about 65 g'],['Fastener','M3 screw, cobalt anodised']]},
  {id:'signet-ring', quips:["No family crest", "Just a blue dot", "Old money", "New screw"], code:'KR-016', name:'Signet Ring', cat:'jewellery', price:140, art:{palette:'halo', layout:'ring', count:8, seed:116}, finishes:METAL, sizes:['US 6','US 7','US 8','US 9','US 10','US 11','US 12'], build:{type:'band', ri:1, ro:1.32, hw:.55, bs:.4, round:true},
   short:'Wide band with a round cobalt seat', copy:'A wide band with a round cobalt seat where a signet would go. No engraving, just the colour.', spec:[['Material','316L stainless, solid'],['Size','11 mm band'],['Weight','about 14 g at US 9'],['Detail','Cobalt anodised titanium insert']]},
  {id:'stack-ring', quips:["One is nice", "Three is a stack", "Five is a lifestyle"], code:'KR-017', name:'Stack Ring', cat:'jewellery', price:70, art:{palette:'dawn', layout:'orbit', count:6, seed:117, streak:.22}, finishes:METAL, sizes:['US 5','US 6','US 7','US 8','US 9','US 10'], build:{type:'band', ri:1, ro:1.12, hw:.16, bs:.16},
   short:'Slim ring with a tiny hex bolt', copy:'A slim band made to stack, with a hex bolt so small you only notice it up close.', spec:[['Material','316L stainless'],['Size','3 mm band, 1.2 mm wall'],['Weight','about 3 g'],['Fastener','M1 hex bolt, cobalt']]},
  {id:'hoops', quips:["Left ear", "Right ear", "Both ears", "Full send"], code:'KR-018', name:'Hoops', cat:'jewellery', price:80, art:{palette:'halo', layout:'orbit', count:7, seed:118, streak:.22}, finishes:METAL, build:{type:'band', ri:1.1, ro:1.2, hw:.1, bs:.12, round:true, present:[1.2, .3, 0]},
   short:'Pair of hoops with a blue clasp', copy:'A pair of small hoops in stainless steel. The clasp is the cobalt part.', spec:[['Material','316L stainless'],['Size','Ø 22 mm, 2 mm'],['Weight','about 2 g each'],['Sold as','A pair']]},
  {id:'catchall', quips:["Catches everything", "Releases nothing", "Like the group chat"], code:'KR-019', name:'Catchall', cat:'desk', price:95, art:{palette:'pool', layout:'grid', count:4, seed:119}, finishes:METAL, build:{type:'tray', w:5.4, h:5.4, r:2.3, d:1.1},
   short:'Round-cornered dish for keys and rings', copy:'A deep, nearly round tray that keeps keys, rings and earbuds in one place by the door.', spec:[['Material','316L stainless, 1.5 mm'],['Size','110 × 110 × 24 mm'],['Weight','about 220 g'],['Fastener','M3 screw, cobalt']]},
  {id:'pen-tray', quips:["Three pens", "One ruler", "Zero chewed lids", "Allegedly"], code:'KR-020', name:'Pen Tray', cat:'desk', price:85, art:{palette:'halo', layout:'column', count:5, seed:120}, finishes:METAL, build:{type:'tray', w:9, h:2.6, r:.8, d:.6},
   short:'Long, low tray for pens', copy:'A long, low tray sized for three pens and a ruler, with one cobalt screw on the rim.', spec:[['Material','316L stainless, 1.5 mm'],['Size','200 × 60 × 14 mm'],['Weight','about 180 g'],['Fastener','M3 screw, cobalt']]},
  {id:'incense-dish', quips:["Light it up", "Calm it down", "Smells like", "A Sunday in March"], code:'KR-021', name:'Incense Dish', cat:'home', price:60, art:{palette:'fig', layout:'ring', count:6, seed:121}, finishes:METAL, build:{type:'dish', r:2.1, h:.5},
   short:'Shallow dish with a blue stick rest', copy:'A shallow turned dish for incense. The cobalt bar holds the stick at the right angle.', spec:[['Material','316L stainless, solid'],['Size','Ø 85 × 12 mm'],['Weight','about 210 g'],['Detail','Cobalt anodised rest']]},
  {id:'ring-dish', quips:["Rings off", "Hands washed", "Rings back on", "Repeat till spotless"], code:'KR-022', name:'Ring Dish', cat:'home', price:55, art:{palette:'halo', layout:'orbit', count:6, seed:122, streak:.22}, finishes:METAL, build:{type:'dish', r:1.6, h:.75},
   short:'Small deep dish for rings', copy:'A small, deep dish for rings and earrings by the sink, with a cobalt bar to hang one on.', spec:[['Material','316L stainless, solid'],['Size','Ø 65 × 18 mm'],['Weight','about 160 g'],['Detail','Cobalt anodised bar']]},
  {id:'pen', quips:["Write it down", "Cross it out", "Sign your name", "Like you mean it"], code:'KR-023', name:'Pen', cat:'desk', price:65, art:{palette:'pool', layout:'column', count:5, seed:123}, finishes:METAL, build:{type:'rod', len:7, r:.24, taper:.55, clip:true, lie:true},
   short:'Machined pen with a blue end cap', copy:'A machined aluminium pen that takes standard refills. The end cap is the cobalt part.', spec:[['Material','6061 aluminium'],['Size','140 × Ø 10 mm'],['Weight','about 22 g'],['Refill','Standard G2 refill']]},
  {id:'bottle-stopper', quips:["Half a bottle left", "Said nobody", "Ever"], code:'KR-024', name:'Bottle Stopper', cat:'home', price:48, art:{palette:'dawn', layout:'scatter', count:6, seed:124}, finishes:METAL, build:{type:'rod', len:2.6, r:.5, taper:.7, knob:true},
   short:'Wine stopper with a steel knob', copy:'A stopper for an open bottle: a tapered silicone-sleeved stem, a cobalt collar and a steel knob to pull it out by.', spec:[['Material','316L stainless, food-safe silicone'],['Size','Ø 30 × 70 mm'],['Weight','about 80 g'],['Detail','Cobalt collar']]},
  {id:'luggage-tag', quips:["Carousel ready", "Spot your bag", "Before the bloke in beige does"], code:'KR-025', name:'Luggage Tag', cat:'carry', price:46, art:{palette:'halo', layout:'scatter', count:7, seed:125}, finishes:METAL, build:{type:'plate', shape:'rrect', w:6, h:3.6, r:.5, t:.22, slot:[-2.2, 0, .45, 1.8], screws:[[2.1, -1.1]], sr:.28},
   short:'Steel tag with a strap slot', copy:'A steel luggage tag with a slot for the strap. Your initials go on the back; the cobalt screw stays on the front.', spec:[['Material','316L stainless, 2 mm'],['Size','60 × 36 mm'],['Weight','about 34 g'],['Personal','Laser engraved on the back']]},
  {id:'dog-tag', quips:["No rank", "No number", "Just steel", "And a blue screw"], code:'KR-026', name:'Dog Tag', cat:'jewellery', price:52, art:{palette:'pool', layout:'orbit', count:5, seed:126, streak:.22}, finishes:METAL, build:{type:'plate', shape:'stadium', w:5, h:2.8, t:.22, holes:[[-1.9, 0, .25]], screws:[[1.5, 0]], sr:.3, ring:[-2.6, 0, .55]},
   short:'Tag pendant on a ball chain', copy:'A tag pendant on a stainless ball chain. Blank on purpose, apart from the cobalt screw.', spec:[['Material','316L stainless'],['Size','50 × 28 mm'],['Chain','2.4 mm ball chain, 60 cm'],['Detail','Cobalt screw']]},
  {id:'cable-clip', quips:["Cable stays up", "Phone stays charged", "Peace on the desk"], code:'KR-027', name:'Cable Clip', cat:'desk', price:18, art:{palette:'halo', layout:'grid', count:9, seed:127, streak:.45}, finishes:METAL, build:{type:'plate', shape:'stadium', w:3.4, h:1.4, t:.5, holes:[[-.8, 0, .4]], screws:[[.8, 0]], sr:.3},
   short:'Weighted clip that holds a cable on the desk', copy:'A small heavy block that keeps a charging cable at the edge of the desk instead of on the floor.', spec:[['Material','316L stainless, solid'],['Size','34 × 14 × 10 mm'],['Weight','about 30 g'],['Holds','Cables up to 7 mm']]},
  {id:'tie-bar', quips:["Tie stays put", "Soup stays off", "Interview goes well"], code:'KR-028', name:'Tie Bar', cat:'jewellery', price:44, art:{palette:'dawn', layout:'column', count:4, seed:128}, finishes:METAL, build:{type:'plate', shape:'rrect', w:6, h:.8, r:.15, t:.16, screws:[[2.4, 0]], sr:.18, present:[-.3, .5, 0]},
   short:'Flat steel tie bar', copy:'A flat stainless tie bar with a sprung back, and the cobalt screw where you\'d expect a logo.', spec:[['Material','316L stainless'],['Size','60 × 8 mm'],['Weight','about 8 g'],['Detail','Cobalt screw']]},
  {id:'candle-holder', quips:["Dinner candle", "Steel cup", "Mood lighting", "Mood improved"], code:'KR-029', name:'Candle Holder', cat:'home', price:68, art:{palette:'halo', layout:'column', count:5, seed:129, size:1.3}, finishes:METAL, build:{type:'dish', r:1.2, h:1.3},
   short:'Turned steel holder for a dinner candle', copy:'A turned steel cup for a dinner candle, heavy enough not to tip, with a cobalt bar to lift it by.', spec:[['Material','316L stainless, solid'],['Size','Ø 48 × 32 mm'],['Weight','about 240 g'],['Fits','22 mm dinner candles']]},
  {id:'record-weight', quips:["Flat record", "Warm sound", "Low tide", "High fidelity"], code:'KR-030', name:'Record Weight', cat:'home', price:120, art:{palette:'night', layout:'ring', count:7, seed:130}, finishes:METAL, build:{type:'plate', shape:'circle', w:3.6, t:1.1, holes:[], screws:[[0, 0]], sr:.5, present:[-.6, .3, 0]},
   short:'Turntable weight for degattis radio', copy:'A solid steel record weight that flattens a warped record on the platter. The cobalt centre sits over the spindle.', spec:[['Material','303 stainless, solid'],['Size','Ø 72 × 22 mm'],['Weight','about 420 g'],['Fits','Standard 7.2 mm spindle']]}
];
function product(id){ for(var i=0;i<PRODUCTS.length;i++) if(PRODUCTS[i].id===id) return PRODUCTS[i]; return null; }

var EDITIONS = [
  {no:'001', title:'Low Tide Hours', date:'04 Dec 2026', palette:'halo', layout:'ring', seed:2, sound:'Tide, bells and a soft drone',
   root:146.83, scale:[0,4,7,9,11,14,16,19], bells:.55, rate:2600, waves:1, pad:'sine',
   tracks:[['Creek','Hiroshi Yoshimura'],["Mr. Henri Rousseau's Dream",'Midori Takada'],['Still Space','Satoshi Ashikawa'],['Xtal','Aphex Twin'],['Roygbiv','Boards of Canada'],['Saku','Susumu Yokota'],['1/1','Brian Eno'],['andata','Ryuichi Sakamoto']]},
  {no:'002', title:'Machine Garden', date:'18 Dec 2026', palette:'dawn', layout:'grid', seed:3, sound:'Slow marimba patterns over a warm pad', root:220, scale:[0,3,5,7,10,12,15,17], bells:.95, rate:1300, waves:0, pad:'triangle'},
  {no:'003', title:'Fog Index', date:'01 Jan 2027', palette:'pool', layout:'column', seed:4, sound:'Low chords under heavy fog', root:87.31, scale:[0,4,7,11,14,16,19,23], bells:.2, rate:3400, waves:.45, pad:'sine'},
  {no:'004', title:'Soft Hardware', date:'15 Jan 2027', palette:'fig', layout:'scatter', seed:5, sound:'Warm bells and a slow pulse', root:130.81, scale:[0,2,4,7,9,12,14,16], bells:.75, rate:1900, waves:.2, pad:'triangle'},
  {no:'005', title:'Still Water', date:'29 Jan 2027', palette:'cobalt', layout:'orbit', seed:6, sound:'Drone and distant water', root:98, scale:[0,7,12,14,19,24], bells:.3, rate:3000, waves:.8, pad:'sine'},
  {no:'006', title:'Night Bus', date:'12 Feb 2027', palette:'night', layout:'ring', seed:7, sound:'Minor chords and a low hum', root:110, scale:[0,3,7,10,12,15,19], bells:.5, rate:2200, waves:.3, pad:'sine'}
];

/* Journal posts: blocks are {p}, {h}, {art, cap}, {wire|render|detail: productId, cap}, {quote} */
var POSTS = [
  {id:'loop-opener-cad', words:['Pencil outline', 'Bottle cap, 26 mm', 'Mouth, 21 × 13.5 mm', '1.5 mm bite', 'Chamfered edge', 'Replaceable steel lip', 'M3 × 4 screw', 'Cobalt anodised', '316L stainless', '4 mm plate', 'Waterjet', 'CNC chamfer', 'Tumbled', 'Key ring hole', 'First CAD pass', 'Weight test', 'Prototype next'], title:'Loop Opener, from sketch to CAD', tag:'Process', date:'09 Nov 2026', product:'loop-opener', art:{palette:'pool', layout:'column', count:4, seed:61, size:1.4},
   dek:'How a bottle opener became the first degattis studios object, and why the screw had to be cobalt.',
   body:[
     {p:'The Loop Opener started as a pencil outline traced around a real bottle cap. The rule was simple: one flat piece of steel, two holes, and a single fastener you would notice.'},
     {wire:'loop-opener', cap:'First CAD pass. One extruded plate, a stadium-shaped mouth for the cap and a small hole for the key ring.'},
     {h:'Getting the mouth right'},
     {p:'A bottle cap is 26 mm across and the lip that does the work only needs about 1.5 mm of bite. The mouth is drawn at 21 × 13.5 mm so it catches the cap from either side. The edge is chamfered so it doesn\'t chew up the cap or your hand.'},
     {p:'The steel lip wears first, so it is a separate part held by the cobalt screw. When it wears down, you swap it instead of the whole opener.'},
     {render:'loop-opener', cap:'Render of the current model in polished 316L.'},
     {detail:'loop-opener', cap:'The M3 screw, anodised cobalt. Prototype colour tests are next.'},
     {p:'Next is a waterjet sample in 4 mm plate to check weight and feel before committing to tooling.'}
   ]},
  {id:'one-cobalt-screw', words:['One part in colour', '#4A6FF0', 'Bare metal', 'No logo', 'Holds a lip', 'Sets a tension', 'Closes a gate', 'Hex bolt', 'M2 titanium', 'Anodising tests', 'Titanium', 'Aluminium', 'Colour match', 'Recognise it across a room', 'Never decoration'], title:'One cobalt screw', tag:'Process', date:'02 Nov 2026', product:'bolt-ring', art:{palette:'cobalt', layout:'orbit', count:6, seed:62, streak:.22},
   dek:'Why every degattis studios object carries exactly one cobalt part, and nothing else in colour.',
   body:[
     {p:'Most brands put a logo on the outside. We wanted something you could recognise across a room without reading anything. The answer was a single piece of hardware in cobalt, #4A6FF0, on otherwise bare metal.'},
     {quote:'If you can see the screw, you know who made it.'},
     {p:'The rule cuts both ways. The objects stay unprinted and unpainted, and the cobalt part always does a job: it holds a lip, sets a tension or closes a gate. It is never there only for decoration.'},
     {detail:'bolt-ring', cap:'The hex bolt on the Bolt Ring, the clearest example of the rule.'},
     {art:{palette:'cobalt', layout:'grid', count:9, seed:5, streak:.4}, cap:'Anodising targets. Titanium and aluminium take the colour differently, so matching them is its own project.'}
   ]},
  {id:'echo-reference', words:['Reeded glass', 'Frosted colour', 'Halftone', 'Grain', 'Fog veil', 'Vertical smear', 'Colour field', 'Six layers', 'Ring', 'Grid', 'Column', 'Orbit', 'Renderer', 'Posters', 'Sleeves', 'Product plates'], title:'The Echo Sonata reference', tag:'Research', date:'21 Oct 2026', art:{palette:'halo', layout:'ring', count:8, seed:2, cx:.58, cy:.56},
   dek:'Where the frosted, reeded-glass look came from, and how we rebuilt it in code.',
   body:[
     {p:'The visual world started with one album cover: colour pushed behind ribbed glass until it reads as a memory of colour. It was the opposite of what we make, and that contrast felt right.'},
     {art:{palette:'halo', layout:'ring', count:8, seed:7, reed:0, blur:.2, streak:.1, halftone:0, grain:0}, cap:'Layer one: the raw colour field.'},
     {art:{palette:'halo', layout:'ring', count:8, seed:7}, cap:'All six layers: smear, reeded glass, fog, halftone and grain on top.'},
     {p:'We rebuilt the effect as a small renderer so every poster, sleeve and product plate can be generated from the same recipe. The whole system lives on the visual direction board.'}
   ]},
  {id:'why-316l', words:['Marine grade', 'Molybdenum', 'Chlorides', 'Sweat', 'Salt water', 'Pockets', 'Fingers', '17-7 PH', 'Spring steel', '6061 aluminium', 'Key tag', 'Carabiner', 'Weight vs wear', 'Anodising'], title:'Why 316L', tag:'Materials', date:'28 Oct 2026', product:'fold-clip', art:{palette:'pool', layout:'scatter', count:7, seed:44, size:1.2},
   dek:'Choosing a stainless steel that survives pockets, sweat and the sea.',
   body:[
     {p:'316L is the marine grade of stainless. The molybdenum in it resists the chlorides in sweat and salt water, which matters for things that live in a pocket or on a finger.'},
     {render:'fold-clip', cap:'The Fold Clip is the exception: it needs spring steel, so it uses 17-7 PH instead.'},
     {p:'Aluminium covers the light parts: the key tag and the carabiner, where weight matters more than wear. Each material takes the cobalt anodising differently, which is the next thing to test.'}
   ]},
  {id:'building-radio', words:['Ambient', 'Environmental', 'Electronic', 'Every two weeks', '4 December', 'Eight tracks', 'The crate', 'The deck', '33⅓', '45', 'Scratch', 'Spotify', 'Low Tide Hours', 'Machine Garden', 'Fog Index'], title:'Building degattis radio', tag:'Radio', date:'14 Nov 2026', art:{palette:'dawn', layout:'grid', count:9, seed:3, streak:.45},
   dek:'A new playlist every two weeks, on Spotify.',
   body:[
     {p:'degattis radio is the sound around the objects: ambient, environmental and electronic music that sits well together. A new edition goes up every two weeks, starting 4 December.'},
     {art:{palette:'halo', layout:'orbit', count:7, seed:3, streak:.2, edge:0}, cap:'Each edition gets its own record artwork from the same renderer as the covers.'},
     {p:'The playlists live on Spotify under degattis radio. Follow along there; the link is at the bottom of every page.'}
   ]}
];
function post(id){ for(var i=0;i<POSTS.length;i++) if(POSTS[i].id===id) return POSTS[i]; return null; }

/* Outside links. Paste the degattis radio Spotify URL and the Instagram profile URL here; until then the site says "coming soon". */
var LINKS = { spotify: '', instagram: '' };

export { CATS, FINISHES, METAL, PRODUCTS, product, EDITIONS, POSTS, post, LINKS };
