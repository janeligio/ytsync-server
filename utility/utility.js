const log = message => console.log(message);

function randomId(length) {
	let id = '';
	for(let i = 0; i < length; i++) {
		id += Math.floor(Math.random() * Math.floor(10))
	}
	return id;
}

function parseURL(URL) {
    // const pattern =/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const pattern =/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/;
    let matches = URL.match(pattern);
    let videoId = '';
    if(matches && matches.length === 3) {
        videoId = matches.pop();
    }
    return videoId;
}

function generateAlias() {
	let randomColorIndex = Math.floor(Math.random() * Math.floor(COLORS.length));
	let randomAnimalIndex = Math.floor(Math.random() * Math.floor(ANIMALS.length));
	return `${COLORS[randomColorIndex]} ${ANIMALS[randomAnimalIndex]}`;
}

const COLORS = [
	"White",
	"Yellow",
	"Blue",
	"Red",
	"Green",
	"Black",
	"Brown",
	"Azure",
	"Ivory",
	"Teal",
	"Silver",
	"Purple",
	"Navy blue",
	"Pea green",
	"Gray",
	"Orange",
	"Maroon",
	"Charcoal",
	"Aquamarine",
	"Coral",
	"Fuchsia",
	"Wheat",
	"Lime",
	"Crimson",
	"Khaki",
	"Hot pink",
	"Magenta",
	"Olden",
	"Plum",
	"Olive",
	"Cyan"
  ];
const ANIMALS = [
	"Aardvark",
	"Abyssinian",
	"Adelie Penguin",
	"Affenpinscher",
	"Afghan Hound",
	"African Bullfrog",
	"African Bush Elephant",
	"African Civet",
	"African Clawed Frog",
	"African Forest Elephant",
	"African Palm Civet",
	"African Penguin",
	"African Tree Toad",
	"African Wild Dog",
	"Ainu",
	"Airedale Terrier",
	"Akbash",
	"Akita",
	"Alaskan Malamute",
	"Albacore Tuna",
	"Albatross",
	"Aldabra Giant Tortoise",
	"Alligator",
	"Alligator Gar",
	"Alpaca",
	"Alpine Dachsbracke",
	"Amazon River Dolphin (Pink Dolphin)",
	"American Alsatian",
	"American Bulldog",
	"American Cocker Spaniel",
	"American Coonhound",
	"American Eskimo Dog",
	"American Foxhound",
	"American Pit Bull Terrier",
	"American Staffordshire Terrier",
	"American Water Spaniel",
	"Amur Leopard",
	"Anatolian Shepherd Dog",
	"Anchovies",
	"Angelfish",
	"Ant",
	"Anteater",
	"Antelope",
	"Appenzeller Dog",
	"Arapaima",
	"Arctic Fox",
	"Arctic Hare",
	"Arctic Wolf",
	"Armadillo",
	"Asian Elephant",
	"Asian Giant Hornet",
	"Asian Palm Civet",
	"Asiatic Black Bear",
	"Aurochs",
	"Australian Cattle Dog",
	"Australian Kelpie Dog",
	"Australian Mist",
	"Australian Shepherd",
	"Australian Terrier",
	"Avocet",
	"Axolotl",
	"Aye Aye",
	"Baboon",
	"Bactrian Camel",
	"Badger",
	"Baiji",
	"Balinese",
	"Banded Palm Civet",
	"Bandicoot",
	"Banjo Catfish",
	"Barb",
	"Barn Owl",
	"Barnacle",
	"Barracuda",
	"Barramundi Fish",
	"Basenji Dog",
	"Basking Shark",
	"Basset Fauve de Bretagne",
	"Basset Hound",
	"Bat",
	"Bavarian Mountain Hound",
	"Beagle",
	"Bear",
	"Bearded Collie",
	"Bearded Dragon",
	"Beaver",
	"Bedlington Terrier",
	"Beetle",
	"Beluga Sturgeon",
	"Bengal Tiger",
	"Bernedoodle",
	"Bernese Mountain Dog",
	"Bichir",
	"Bichon Frise",
	"Biewer Terrier",
	"Binturong",
	"Bird",
	"Birds Of Paradise",
	"Birman",
	"Bison",
	"Black Marlin",
	"Black Rhinoceros",
	"Black Russian Terrier",
	"Black Widow Spider",
	"Blobfish",
	"Bloodhound",
	"Blue Jay",
	"Blue Lacy Dog",
	"Blue Whale",
	"Bluefin Tuna",
	"Bluetick Coonhound",
	"Bobcat",
	"Bolognese Dog",
	"Bombay",
	"Bongo",
	"Bonito Fish",
	"Bonobo",
	"Booby",
	"Border Collie",
	"Border Terrier",
	"Bornean Orang-utan",
	"Borneo Elephant",
	"Boston Terrier",
	"Bottlenose Dolphin",
	"Bowfin",
	"Bowhead Whale",
	"Boxer Dog",
	"Boykin Spaniel",
	"Brazilian Terrier",
	"British Timber",
	"Brown Bear",
	"Budgerigar",
	"Buffalo",
	"Bull Shark",
	"Bull Terrier",
	"Bulldog",
	"Bullfrog",
	"Bullmastiff",
	"Bumblebee",
	"Burmese",
	"Burrowing Frog",
	"Butterfly",
	"Butterfly Fish",
	"Caiman",
	"Caiman Lizard",
	"Cairn Terrier",
	"Camel",
	"Camel Spider",
	"Canaan Dog",
	"Canadian Eskimo Dog",
	"Capybara",
	"Caracal",
	"Carolina Dog",
	"Carp",
	"Cassowary",
	"Cat",
	"Caterpillar",
	"Catfish",
	"Cavalier King Charles Spaniel",
	"Cavapoo",
	"Centipede",
	"Cesky Fousek",
	"Chameleon",
	"Chamois",
	"Cheetah",
	"Chesapeake Bay Retriever",
	"Chicken",
	"Chihuahua",
	"Chimaera",
	"Chimpanzee",
	"Chinchilla",
	"Chinese Crested Dog",
	"Chinese Paddlefish",
	"Chinook",
	"Chinstrap Penguin",
	"Chipmunk",
	"Chow Chow",
	"Cichlid",
	"Clouded Leopard",
	"Clownfish",
	"Clumber Spaniel",
	"Coati",
	"Cockatoo",
	"Cockroach",
	"Codfish",
	"Coelacanth",
	"Collared Peccary",
	"Collie",
	"Colossal Squid",
	"Common Buzzard",
	"Common Frog",
	"Common Loon",
	"Common Toad",
	"Cooper’s Hawk",
	"Coral",
	"Cotton-top Tamarin",
	"Cougar",
	"Cow",
	"Coyote",
	"Crab",
	"Crab-Eating Macaque",
	"Crane",
	"Crested Penguin",
	"Crocodile",
	"Cross River Gorilla",
	"Curly Coated Retriever",
	"Cuscus",
	"Cuttlefish",
	"Dachshund",
	"Dalmatian",
	"Darwin’s Frog",
	"Deer",
	"Desert Rain Frog",
	"Desert Tortoise",
	"Deutsche Bracke",
	"Dhole",
	"Dingo",
	"Discus",
	"Doberman Pinscher",
	"Dodo",
	"Dog",
	"Dogo Argentino",
	"Dogue De Bordeaux",
	"Dolphin",
	"Donkey",
	"Dormouse",
	"Dragonfish",
	"Dragonfly",
	"Drever",
	"Drum Fish",
	"Duck",
	"Dugong",
	"Dunker",
	"Dusky Dolphin",
	"Dwarf Crocodile",
	"Eagle",
	"Earwig",
	"Eastern Gorilla",
	"Eastern Lowland Gorilla",
	"Echidna",
	"Edible Frog",
	"Eel",
	"Egyptian Mau",
	"Electric Eel",
	"Elephant",
	"Elephant Seal",
	"Elephant Shrew",
	"Emperor Penguin",
	"Emperor Tamarin",
	"Emu",
	"English Cocker Spaniel",
	"English Shepherd",
	"English Springer Spaniel",
	"Entlebucher Mountain Dog",
	"Epagneul Pont Audemer",
	"Ermine",
	"Eskimo Dog",
	"Estrela Mountain Dog",
	"Falcon",
	"False Killer Whale",
	"Fangtooth",
	"Fennec Fox",
	"Ferret",
	"Field Spaniel",
	"Fin Whale",
	"Finnish Spitz",
	"Fire-Bellied Toad",
	"Fish",
	"Fishing Cat",
	"Flamingo",
	"Flat-Coated Retriever",
	"Florida Gar",
	"Flounder",
	"Fluke Fish (summer flounder)",
	"Fly",
	"Flying Squirrel",
	"Fossa",
	"Fox",
	"Fox Terrier",
	"French Bulldog",
	"Frigatebird",
	"Frilled Lizard",
	"Frilled Shark",
	"Frog",
	"Fur Seal",
	"Galapagos Penguin",
	"Galapagos Tortoise",
	"Gar",
	"Gecko",
	"Gentoo Penguin",
	"Geoffroys Tamarin",
	"Gerbil",
	"German Pinscher",
	"German Shepherd Guide",
	"Gharial",
	"Giant African Land Snail",
	"Giant Clam",
	"Giant Panda Bear",
	"Giant Schnauzer",
	"Gibbon",
	"Gila Monster",
	"Giraffe",
	"Glass Frog",
	"Glass Lizard",
	"Glow Worm",
	"Goat",
	"Goblin Shark",
	"Golden Lion Tamarin",
	"Golden Masked Owl",
	"Golden Oriole",
	"Golden Retriever",
	"Golden-Crowned Flying Fox",
	"Goliath Frog",
	"Goose",
	"Gopher",
	"Gorilla",
	"Gouldian Finch",
	"Grasshopper",
	"Gray Tree Frog",
	"Great Dane",
	"Great Pyrenees",
	"Great White Shark",
	"Greater Swiss Mountain Dog",
	"Green Anole",
	"Green Bee-Eater",
	"Green Frog",
	"Green Tree Frog",
	"Greenland Dog",
	"Grey Mouse Lemur",
	"Grey Reef Shark",
	"Grey Seal",
	"Greyhound",
	"Grizzly Bear",
	"Grouse",
	"Guinea Fowl",
	"Guinea Pig",
	"Guppy",
	"Hagfish",
	"Hammerhead Shark",
	"Hamster",
	"Hare",
	"Harpy Eagle",
	"Harrier",
	"Havanese",
	"Havapoo",
	"Hawaiian Crow",
	"Hedgehog",
	"Hercules Beetle",
	"Hermit Crab",
	"Heron",
	"Herring",
	"Highland Cattle",
	"Himalayan",
	"Hippopotamus",
	"Honey Badger",
	"Honey Bee",
	"Hoopoe",
	"Horn Shark",
	"Hornbill",
	"Horned Frog",
	"Horse",
	"Horseshoe Crab",
	"House Finch",
	"Howler Monkey",
	"Human",
	"Humboldt Penguin",
	"Hummingbird",
	"Humpback Whale",
	"Hyena",
	"Ibis",
	"Ibizan Hound",
	"Iguana",
	"Immortal Jellyfish",
	"Impala",
	"Indian Elephant",
	"Indian Palm Squirrel",
	"Indian Rhinoceros",
	"Indian Star Tortoise",
	"Indochinese Tiger",
	"Indri",
	"Insects",
	"Irish Doodle",
	"Irish Setter",
	"Irish WolfHound",
	"Italian Greyhound",
	"Jack Russell",
	"Jackal",
	"Jaguar",
	"Japanese Chin",
	"Japanese Macaque",
	"Javan Rhinoceros",
	"Javanese",
	"Jellyfish",
	"Jerboa",
	"Kakapo",
	"Kangaroo",
	"Keel-Billed Toucan",
	"Keeshond",
	"Killer Whale",
	"King Cobra",
	"King Crab",
	"King Penguin",
	"Kingfisher",
	"Kinkajou",
	"Kiwi",
	"Koala",
	"Komodo Dragon",
	"Krill",
	"Kudu",
	"Labradoodle",
	"Labrador Retriever",
	"Ladybug",
	"Lamprey",
	"Leaf-Tailed Gecko",
	"Lemming",
	"Lemur",
	"Leopard",
	"Leopard Cat",
	"Leopard Frog",
	"Leopard Seal",
	"Leopard Tortoise",
	"Liger",
	"Lion",
	"Lionfish",
	"Little Penguin",
	"Lizard",
	"Llama",
	"Loach",
	"Lobster",
	"Long-Eared Owl",
	"Longnose Gar",
	"Lungfish",
	"Lynx",
	"Macaroni Penguin",
	"Macaw",
	"Magellanic Penguin",
	"Magpie",
	"Maine Coon",
	"Malayan Civet",
	"Malayan Tiger",
	"Maltese",
	"Maltipoo",
	"Manatee",
	"Mandrill",
	"Maned Wolf",
	"Manta Ray",
	"Marine Toad",
	"Markhor",
	"Marmot",
	"Marsh Frog",
	"Masked Palm Civet",
	"Mastiff",
	"Mayfly",
	"Meerkat",
	"Megalodon",
	"Mexican Free-Tailed Bat",
	"Milkfish",
	"Millipede",
	"Mink",
	"Minke Whale",
	"Mole",
	"Molly",
	"Monarch Butterfly",
	"Mongoose",
	"Mongrel",
	"Monitor Lizard",
	"Monkey",
	"Monkfish",
	"Monte Iberia Eleuth",
	"Moorhen",
	"Moose",
	"Moray Eel",
	"Moth",
	"Mountain Gorilla",
	"Mountain Lion",
	"Mourning Dove",
	"Mouse",
	"Mule",
	"Muskrat",
	"Narwhal",
	"Neanderthal",
	"Neapolitan Mastiff",
	"Newfoundland",
	"Newt",
	"Nightingale",
	"Norfolk Terrier",
	"North American Black Bear",
	"Northern Inuit Dog",
	"Norwegian Forest",
	"Numbat",
	"Nurse Shark",
	"Ocelot",
	"Octopus",
	"Okapi",
	"Old English Sheepdog",
	"Olm",
	"Opossum",
	"Orang-utan",
	"Ostrich",
	"Otter",
	"Oyster",
	"Paddlefish",
	"Pademelon",
	"Pangolin",
	"Panther",
	"Parrot",
	"Patas Monkey",
	"Peacock",
	"Peekapoo",
	"Pekingese",
	"Pelican",
	"Penguin",
	"Pere Davids Deer",
	"Peregrine Falcon",
	"Persian",
	"Petit Basset Griffon Vendéen",
	"Pheasant",
	"Pied Tamarin",
	"Pig",
	"Pigeon",
	"Pika",
	"Pike Fish",
	"Pileated Woodpecker",
	"Pink Fairy Armadillo",
	"Piranha",
	"Platypus",
	"Pointer",
	"Poison Dart Frog",
	"Polar Bear",
	"Pomapoo",
	"Pomeranian",
	"Pond Skater",
	"Poodle",
	"Pool Frog",
	"Porcupine",
	"Porpoise",
	"Possum",
	"Prawn",
	"Proboscis Monkey",
	"Pufferfish",
	"Puffin",
	"Pug",
	"Puma",
	"Purple Emperor Butterfly",
	"Purple Finch",
	"Puss Moth",
	"Pygmy Hippopotamus",
	"Pygmy Marmoset",
	"Quail",
	"Quetzal",
	"Quokka",
	"Quoll",
	"Rabbit",
	"Raccoon",
	"Raccoon Dog",
	"Radiated Tortoise",
	"Ragdoll",
	"Rat",
	"Rattlesnake",
	"Red Finch",
	"Red Fox",
	"Red Knee Tarantula",
	"Red Panda",
	"Red Wolf",
	"Red-handed Tamarin",
	"Reindeer",
	"Rhinoceros",
	"River Turtle",
	"Robin",
	"Rock Hyrax",
	"Rockfish",
	"Rockhopper Penguin",
	"Roseate Spoonbill",
	"Rottweiler",
	"Royal Penguin",
	"Russian Blue",
	"Saarloos Wolfdog",
	"Saber-Toothed Tiger",
	"Sable",
	"Saiga",
	"Saint Berdoodle",
	"Saint Bernard",
	"Salamander",
	"Salmon",
	"Samoyed",
	"Sand Lizard",
	"Saola",
	"Sardines",
	"Sawfish",
	"Schnoodle",
	"Scimitar-horned Oryx",
	"Scorpion",
	"Scorpion Fish",
	"Sea Dragon",
	"Sea Lion",
	"Sea Otter",
	"Sea Slug",
	"Sea Squirt",
	"Sea Turtle",
	"Sea Urchin",
	"Seahorse",
	"Seal",
	"Serval",
	"Shark",
	"Sheep",
	"Sheepadoodle",
	"Shiba Inu",
	"Shih Tzu",
	"Shrimp",
	"Siamese",
	"Siamese Fighting Fish",
	"Siberian",
	"Siberian Husky",
	"Siberian Tiger",
	"Silver Dollar",
	"Skate Fish",
	"Skipjack Tuna",
	"Skunk",
	"Sloth",
	"Slow Worm",
	"Snail",
	"Snake",
	"Snapping Turtle",
	"Snowshoe",
	"Snowshoe Hare",
	"Snowy Owl",
	"Somali",
	"South China Tiger",
	"Spadefoot Toad",
	"Sparrow",
	"Spectacled Bear",
	"Sperm Whale",
	"Spider Monkey",
	"Spiny Dogfish",
	"Spixs Macaw",
	"Sponge",
	"Spotted Gar",
	"Squid",
	"Squirrel",
	"Squirrel Monkey",
	"Sri Lankan Elephant",
	"Staffordshire Bull Terrier",
	"Stag Beetle",
	"Starfish",
	"Steller’s Sea Cow",
	"Stick Insect",
	"Stingray",
	"Stoat",
	"Striped Rocket Frog",
	"Sturgeon",
	"Sucker Fish",
	"Sugar Glider",
	"Sumatran Elephant",
	"Sumatran Orang-utan",
	"Sumatran Rhinoceros",
	"Sumatran Tiger",
	"Sun Bear",
	"Swai Fish",
	"Swan",
	"Swedish Vallhund",
	"Tamaskan",
	"Tang",
	"Tapanuli Orang-utan",
	"Tapir",
	"Tarpon",
	"Tarsier",
	"Tasmanian Devil",
	"Tawny Owl",
	"Teddy Roosevelt Terrier",
	"Termite",
	"Tetra",
	"Thorny Devil",
	"Tibetan Mastiff",
	"Tiffany",
	"Tiger",
	"Tiger Salamander",
	"Tiger Shark",
	"Toadfish",
	"Tortoise",
	"Toucan",
	"Tree Frog",
	"Tropicbird",
	"Tuatara",
	"Tuna",
	"Turkey",
	"Turkish Angora",
	"Uakari",
	"Uguisu",
	"Umbrellabird",
	"Utonagan",
	"Vampire Bat",
	"Vampire Squid",
	"Vaquita",
	"Vervet Monkey",
	"Vulture",
	"Wallaby",
	"Walleye Fish",
	"Walrus",
	"Wandering Albatross",
	"Warthog",
	"Wasp",
	"Water Buffalo",
	"Water Dragon",
	"Water Vole",
	"Weasel",
	"Welsh Corgi",
	"West Highland Terrier",
	"Western Gorilla",
	"Western Lowland Gorilla",
	"Whale Shark",
	"Whippet",
	"White Rhinoceros",
	"White Tiger",
	"White-Faced Capuchin",
	"Whooping Crane",
	"Wild Boar",
	"Wildebeest",
	"Wolf",
	"Wolf Eel",
	"Wolf Spider",
	"Wolffish",
	"Wolverine",
	"Wombat",
	"Woodlouse",
	"Woodpecker",
	"Woolly Mammoth",
	"Woolly Monkey",
	"Wrasse",
	"Wyoming Toad",
	"X-Ray Tetra",
	"Xerus",
	"Yak",
	"Yellow-Eyed Penguin",
	"Yellowfin Tuna",
	"Yorkshire Terrier",
	"Zebra",
	"Zebra Shark",
	"Zebu",
	"Zonkey",
	"Zorse"
];
module.exports = { log, randomId, generateAlias, parseURL };