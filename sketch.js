// I am only using "let" instead of "var" in my for loops because i was deducted a point in the midterms for not doing so
// otherwise, there is no intention of writing the code in ES6 syntax, thank you.

//the game might lag depending on the player's laptop due to the draw() function only running at 60 fps

//start of code written by Kellyn Joycelee
var gameChar_x; //anchor point at middle-bottom of the sprite (game character)
var gameChar_y;
var floorPos_y;

var isLeft;
var isRight;
var isFalling;
var isPlummeting;
var isBlocked;

var jumpDistance;

var collectables;
var canyons;
var trees_x;
var treePos_y;
var birds; // replacement of clouds to match the theme of the game
var hedges; // replacement of mountains to match the theme of the game
var flagPole;

var cameraPosX;
var gameScore;
var prevScore;
var totalScore;
var lives;
var gameOver;
var victory;

var prevLevel;
var currentLevel;

var nextScene; // if nextScene is false, it means that a game UI (cutscene) is still showing / actual gameplay of the level is paused
var sceneCount;

var storyText;

var platforms;
var blocks;

var shields;
var protection; // protection is an extra life that protects the player from dying once when they touch an enemy or missile, can be obtained by collecting a shield and only one can be active at a time
var immortalityStartTime; // the frame count when immortality starts, used to track the duration of immortality

var emit;

var missiles;
var enemies;

var bgm; //{Nocturne} 800 trillion miles from home by Sophia_C. Downloaded from : https://freesound.org/people/Sophia_C/sounds/816735/
var jumpSound; //Cloud Poof by qubodup. Downloaded from : https://freesound.org/people/qubodup/sounds/714258/
var collectSound; //reflection.mp3 by Taira Komori. Downloaded from : https://freesound.org/people/Taira%20Komori/sounds/214048/
var levelCompleteSound; //Battle Horn by Porphyr. Downloaded from : https://freesound.org/people/Porphyr/sounds/188815/
var respawnSound; //Level Up/Mission Complete (Fantasy).wav by SilverIllusionist. Downloaded from : https://freesound.org/people/SilverIllusionist/sounds/665203/
var gameOverSound; //Piano Flourish 12 by SilverIllusionist. Downloaded from : https://freesound.org/people/SilverIllusionist/sounds/845728/
var soundCounter; //to make sure that all the sounds have finished loading before the game starts, to accomodate weaker laptops

function preload() {
    soundCounter = 0;
    soundFormats("wav");

    bgm = loadSound("assets/bgm.wav", soundFileLoaded);
    bgm.setVolume(1);

    jumpSound = loadSound("assets/jumpSound.wav", soundFileLoaded);
    jumpSound.setVolume(0.5);

    collectSound = loadSound("assets/collectSound.wav", soundFileLoaded);
    collectSound.setVolume(0.3);

    levelCompleteSound = loadSound("assets/levelCompleteSound.wav", soundFileLoaded);
    levelCompleteSound.setVolume(1);

    respawnSound = loadSound("assets/respawnSound.wav", soundFileLoaded);
    respawnSound.setVolume(1);

    gameOverSound = loadSound("assets/gameOverSound.wav", soundFileLoaded);
    gameOverSound.setVolume(1);
}

function soundFileLoaded() {
    soundCounter++;
}

function setup() {
    //every initialization that were supposed to done in setup() as per requirements in coursera, is transferred to startGame() to accomodate replay after gameOver state
    startGame();
}

//this startGame function is different than the one in coursera game project 6 instructions, the previous startGame function was renamed to startLevel
function startGame() {
    createCanvas(1024, 576);
    frameRate(60);
    floorPos_y = height * 3 / 4;
    gameOver = false;
    victory = false;
    totalScore = 0;
    prevGameScore = 0;
    prevLevel = 0;
    currentLevel = 0;
    sceneCount = 1;
    immortalityStartTime = 1; //the number 1 only means that immortality is not active here
    bgm.loop();
    startCurrentLevel();
}

function draw() {
    //dont start the game until all sounds are loaded
    if (soundCounter != 6) {
        return;
    }

    ////////////////~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~// ANIMATE IN-GAME OBJECTS DRAWING CODE //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//////////////////
    cameraPosX = gameChar_x - width / 2;

    background(255);

    //extra side scrolling effect code (the one after this is the main one), because in order for the hedges to look as intended with minimal lines of code, it must be covered by the green ground
    push();
    translate(-cameraPosX, 0);

    //draw the hedges
    for (let i = 0; i < hedges.length; i++) {
        hedges[i].draw();
    }

    pop(); //end of the extra side scrolling effect

    //draw the ground
    noStroke();
    fill(100);
    rect(0, floorPos_y, width, height - floorPos_y);

    //side scrolling effect (scroll at the middle / center of focus (middle) is always at the game character)
    push();
    translate(-cameraPosX, 0);

    //draw the birds
    for (let i = 0; i < birds.length; i++) {
        birds[i].draw();
    }

    //draw the trees
    drawTrees();

    //draw the platforms
    for (let i = 0; i < platforms.length; i++) {
        platforms[i].draw();
    }

    //draw the blocks
    for (let i = 0; i < blocks.length; i++) {
        blocks[i].draw();
        blocks[i].checkContact(gameChar_x, gameChar_y);
    }

    //draw the canyon
    for (let i = 0; i < canyons.length; i++) {
        canyons[i].draw();

        var isContact = canyons[i].checkContact(gameChar_x, gameChar_y);
        if (isContact) {
            isPlummeting = true;
            //restrict left and right movement when plummeting in t_canyon
            isLeft = false;
            isRight = false;
            break;
        }
    }

    //draw the collectable
    for (let i = 0; i < collectables.length; i++) {
        //when collectable is not yet collected, make the collectable appear(draw the collectable)
        if (!collectables[i].isFound) {
            collectables[i].draw();
            collectables[i].checkContact(gameChar_x, gameChar_y);
        }
    }

    //draw the shields
    for (let i = 0; i < shields.length; i++) {
        //when shield is not yet collected, make the shield appear(draw the shield)
        if (!shields[i].isFound) {
            shields[i].draw();
            shields[i].checkContact(gameChar_x, gameChar_y);
        }
    }

    //draw the flag pole
    drawFlagPole();

    //draw the enemies
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].draw();

        //the player receives damage when in contact with and enemy
        var isContact = enemies[i].checkContact(gameChar_x, gameChar_y);
        if (isContact) {
            receiveDamage();
            break;
        }
    }

    //draw the missiles
    for (let i = 0; i < missiles.length; i++) {
        missiles[i].draw();

        //the player receives damage when hit by a missile
        var isContact = missiles[i].checkContact(gameChar_x, gameChar_y);
        if (isContact) {
            receiveDamage();
            break;
        }
    }

    //create the immortality system
    //deactivate immortality after a few seconds of immortality when player receives damage without protection
    if (frameCount - immortalityStartTime > 20 && immortalityStartTime != 1) {
        immortalityStartTime = 1;
    }

    //draw the emitter for the gradient effect
    emit.updateParticles();

    //draw the game character
    drawGameChar();

    //draw protection around the game character if active
    drawProtection();

    pop();

    //////////////////////~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~// STATS AND TEXT DRAWING CODE //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//////////////////////


    //disabling the display of texts and current level lives on cutscenes
    if (nextScene && !gameOver) {
        //display curernt level 
        displayLevel();

        //display game score
        displayScore();

        //draw player's lives
        drawLives(lives);

        //display text after collecting collectable
        if (gameScore > 0 && !gameOver) {
            displayText();
        }
    }

    ////////////////////////////~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~// INTERACTION CODE //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~////////////////////////////

    //move game character to the left
    if (isLeft) {
        gameChar_x -= 3;
        //restrict movement to the left any further if there is a block on the pathway / is coliding with a block object
        if (isBlocked) {
            gameChar_x += 3;
            isBlocked = false;
        }
    }
    //move game character to the right
    if (isRight) {
        gameChar_x += 3;
        //restrict movement to the right any further if there is a block on the pathway / is coliding with a block object
        if (isBlocked) {
            gameChar_x -= 3;
            isBlocked = false;
        }
    }
    //game character falling down after jumping
    if (gameChar_y < floorPos_y) {
        var isContact = false;

        //landing on a platform
        for (let i = 0; i < platforms.length; i++) {
            if (platforms[i].checkContact(gameChar_x, gameChar_y)) {
                isContact = true; //for the game character to land on the platform
                isFalling = false; //so that when the character lands on the platform it is looking forward and not in a falling state

                if (platforms[i].isMovingHorizontally && platforms[i].range > 0) { //physics helper for horizontally moving platforms
                    //make it so that when the game character tries to walk opposing the direction of the platform is moving, the game character's movement will not get restricted
                    if (!((platforms[i].inc < 0 && isRight) || (platforms[i].inc > 0 && isLeft))) {
                        gameChar_x += platforms[i].inc;
                    }
                }
                else if (!platforms[i].isMovingHorizontally && platforms[i].range > 0) { //physics helper for vertically moving platforms
                    gameChar_y += platforms[i].inc;
                }
                break;
            };
        }

        //landing on a block
        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].checkContact(gameChar_x, gameChar_y)) {
                isContact = true; //for the game character to land on the block
                isFalling = false; //so that when the character lands on the platform it is looking forward and not in a falling state
                break;
            };
        }

        if (!isContact) {
            isFalling = true;
            gameChar_y += 3; //only decrement gameChar_y when is not in contact with any platforms or blocks mid-air
        };
    }
    else {
        if (!isPlummeting) { //exclude plummeting action, so only when jumping and landing on the ground
            gameChar_y = floorPos_y; //to prevent sprite from clipping to the ground due to imperfect maths
        }
        isFalling = false; //to go back standing after jumping motion
    }

    //game character falling into canyon
    if (isPlummeting) {
        gameChar_y += 7;
    }

    //check if game character is under a block and update jump distance accordingly
    for (let i = 0; i < blocks.length; i++) {
        if (gameChar_y > blocks[i].y && (gameChar_x < blocks[i].x + blocks[i].width && gameChar_x > blocks[i].x)) {
            // restrict jumping length as to the distance between game character's max y and block max height(block y + block height)
            var d = (gameChar_y - 20) - (blocks[i].y + blocks[i].height);
            if (d < 100) {
                jumpDistance = d;
                break;
            }
        }
        else {
            jumpDistance = 100;
        }
    }

    ////////////////////////////~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~// GAMESTATE CHECKING CODE //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~////////////////////////////

    //check for deaths
    checkPlayerDie();

    //check if game character is in range of the flag pole (win the game)
    checkFlagPole();

    //draw game state / ending (either victory or game over)
    drawGameEnd();

    ////////////////////////////~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~// UI DRAWING CODE //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~////////////////////////////

    //START GAME UI (sceneCount 1), MENU UI (all odd sceneCount)
    if (!nextScene && sceneCount % 2 != 0) {
        drawMenuUI();
    }

    //DAY REMINDERS (all even sceneCount)
    if (!nextScene && (sceneCount % 2 == 0)) {
        dayReminder();
    }
}

//-----------------------------------------------------------// GAME LEVEL DESIGN FUNCTION //--------------------------------------------------------------------//

function startLevel() {
    if (currentLevel == 1) {
        gameChar_x = width / 2;
        gameChar_y = floorPos_y;

        cameraPosX = 0;
        gameScore = 0;

        isLeft = false;
        isRight = false;
        isFalling = false;
        isPlummeting = false;
        isBlocked = false;
        protection = false; //initially player is not protected until shield is collected

        jumpDistance = 100;

        collectables = [];
        collectables.push(new Collectable(-280, floorPos_y - 120, false));
        collectables.push(new Collectable(865, floorPos_y - 180, false));
        collectables.push(new Collectable(1305, floorPos_y - 30, false));

        shields = [];
        shields.push(new Shield(350, floorPos_y - 190, false));
        shields.push(new Shield(740, floorPos_y - 120, false));

        canyons = [];
        canyons.push(createCanyons(-1000, 800));
        canyons.push(createCanyons(150, 100));
        canyons.push(createCanyons(350, 100));
        canyons.push(createCanyons(320, 20));
        canyons.push(createCanyons(590, 500));

        trees_x = [];
        for (let i = 0; i < 20; i++) {
            trees_x.push(random(0, 1800));
        }
        treePos_y = height / 2 - 38;

        //randomized the fixed values of some objects

        birds = [];
        birds.push(createBirds(144, random(130, 300), random(0.5, 1), 0.5));
        birds.push(createBirds(300, random(130, 300), random(0.5, 1), 0.9));
        birds.push(createBirds(500, random(130, 300), random(0.5, 1), 0.2));


        hedges = [];
        hedges.push(createHedges(50, floorPos_y - 12, 1.1));
        hedges.push(createHedges(290, floorPos_y - 12, 0.7));
        hedges.push(createHedges(500, floorPos_y - 12, 0.5));
        hedges.push(createHedges(790, floorPos_y - 12, 0.9));
        hedges.push(createHedges(900, floorPos_y - 12, 0.7));
        hedges.push(createHedges(1200, floorPos_y - 12, 0.9));
        hedges.push(createHedges(1500, floorPos_y - 12, 0.7));

        flagPole = {
            isReached: false,
            x_pos: 1500
        };

        platforms = [];
        //static platforms
        platforms.push(new Platforms(100, floorPos_y - 80, 100, 0, 0, false));
        platforms.push(new Platforms(250, floorPos_y - 120, 200, 0, 0, false));
        platforms.push(new Platforms(618, floorPos_y - 90, 50, 0, 0, false));
        platforms.push(new Platforms(813, floorPos_y - 50, 50, 0, 0, false));
        platforms.push(new Platforms(880, floorPos_y - 90, 50, 0, 0, false));
        platforms.push(new Platforms(945, floorPos_y - 130, 50, 0, 0, false));
        platforms.push(new Platforms(1007, floorPos_y - 90, 50, 0, 0, false));
        //moving platforms
        platforms.push(new Platforms(-250, floorPos_y - 100, 50, 80, 1, false));
        platforms.push(new Platforms(560, floorPos_y - 100, 30, 80, 1, false));
        platforms.push(new Platforms(680, floorPos_y - 90, 50, 80, 1, true));

        enemies = [];
        enemies.push(new Enemy(-180, floorPos_y - 10, 200));
        enemies.push(new Enemy(260, floorPos_y - 135, 180));
        enemies.push(new Enemy(1180, floorPos_y - 10, 270));

        blocks = [];
        blocks.push(new Block(-190, floorPos_y - 115, 230, 50));
        blocks.push(new Block(100, floorPos_y - 298, 100, 100));
        blocks.push(new Block(590, floorPos_y - 432, 500, 232));

        missiles = [];
        for (let i = 0; i < 8; i++) {
            missiles.push(new Missile(610 + 65 * i, floorPos_y + 50, 300));
        }

        emit = new Emitter(floorPos_y + 5, 0, 10, 15, color(0, 60));
        emit.startEmitter(9000, 20);

        storyText = ["1 -- Aubade of Bones",
            "The light calls me gently, I step willingly, for honor weighs more than fear.",
            "I have danced with the dawn before, and my shadow smiles even as I burn.",
            "My hands are empty, yet I hold everything I must leave behind.",];
    }

    else if (currentLevel == 2) {
        gameChar_x = 150;
        gameChar_y = 0;

        cameraPosX = 0;
        gameScore = 0;

        isLeft = false;
        isRight = false;
        isFalling = false;
        isPlummeting = false;
        isBlocked = false;
        protection = false; //initially player is not protected until shield is collected

        jumpDistance = 100;

        collectables = [];
        collectables.push(new Collectable(-190, floorPos_y - 30, false));
        collectables.push(new Collectable(930, 90, false));
        collectables.push(new Collectable(1380, floorPos_y - 100, false));

        shields = [];
        shields.push(new Shield(150, 190, false));
        shields.push(new Shield(930, 120, false));

        canyons = [];
        canyons.push(createCanyons(-1000, 800));
        canyons.push(createCanyons(200, 100));
        canyons.push(createCanyons(400, 1000));

        trees_x = [];
        for (let i = 0; i < 20; i++) {
            trees_x.push(random(0, 1800));
        }
        treePos_y = height / 2 - 38;

        //randomized the fixed values of some objects

        birds = [];
        birds.push(createBirds(144, random(130, 300), random(0.5, 1), 0.5));
        birds.push(createBirds(300, random(130, 300), random(0.5, 1), 0.9));
        birds.push(createBirds(500, random(130, 300), random(0.5, 1), 0.2));


        hedges = [];
        hedges.push(createHedges(50, floorPos_y - 12, 1.1));
        hedges.push(createHedges(290, floorPos_y - 12, 0.7));
        hedges.push(createHedges(500, floorPos_y - 12, 0.5));
        hedges.push(createHedges(790, floorPos_y - 12, 0.9));
        hedges.push(createHedges(900, floorPos_y - 12, 0.7));
        hedges.push(createHedges(1200, floorPos_y - 12, 0.9));
        hedges.push(createHedges(1500, floorPos_y - 12, 0.7));

        flagPole = {
            isReached: false,
            x_pos: 1500
        };

        platforms = [];
        //static platforms
        platforms.push(new Platforms(130, 150, 40, 0, 0, false));
        platforms.push(new Platforms(450, floorPos_y - 150, 950, 0, 0, false));
        //moving platforms
        platforms.push(new Platforms(400, floorPos_y - 100, 30, 80, 1, false));
        platforms.push(new Platforms(700, floorPos_y - 250, 100, 250, 3, true));

        enemies = [];
        enemies.push(new Enemy(-160, floorPos_y - 10, 350));
        enemies.push(new Enemy(110, 205, 80));
        enemies.push(new Enemy(465, floorPos_y - 165, 925));

        blocks = [];
        blocks.push(new Block(0, 220, 200, 100));
        blocks.push(new Block(0, 220, 200, 100));
        blocks.push(new Block(-800, 0, 900, floorPos_y - 112));

        missiles = [];
        for (let i = 0; i < 23; i++) {
            missiles.push(new Missile(-1000 + 35 * i, floorPos_y + 50, 220));
        }
        for (let i = 0; i < 3; i++) {
            missiles.push(new Missile(215 + 35 * i, floorPos_y + 50, 500));
        }
        for (let i = 0; i < 15; i++) {
            missiles.push(new Missile(440 + 65 * i, floorPos_y + 50, 600));
        }

        emit = new Emitter(floorPos_y + 5, 0, 10, 15, color(0, 60));
        emit.startEmitter(9000, 20);

        storyText = ["2 -- Obsidian Eyes",
            "I wonder if he knows he walks where we once chose to fall.",
            "They do not see me as I was, they see only what lingers in my empty gaze.",
            "I envy the sun for its fire, for it knows the shape of surrender.",
            "\" The forest is silent, yet the bones hum a song I cannot name.. \""];
    }

    else if (currentLevel == 3) {
        gameChar_x = width / 2;
        gameChar_y = floorPos_y;

        cameraPosX = 0;
        gameScore = 0;

        isLeft = false;
        isRight = false;
        isFalling = false;
        isPlummeting = false;
        isBlocked = false;
        protection = false; //initially player is not protected until shield is collected

        jumpDistance = 100;

        collectables = [];
        collectables.push(new Collectable(150, floorPos_y - 120, false));
        collectables.push(new Collectable(905, floorPos_y - 100, false));
        collectables.push(new Collectable(1305, floorPos_y - 30, false));

        shields = [];
        shields.push(new Shield(365, floorPos_y - 190, false));
        shields.push(new Shield(905, floorPos_y - 135, false));

        canyons = [];
        canyons.push(createCanyons(-1000, 800));
        canyons.push(createCanyons(150, 100));
        canyons.push(createCanyons(350, 100));
        canyons.push(createCanyons(320, 20));
        canyons.push(createCanyons(590, 500));

        trees_x = [];
        for (let i = 0; i < 20; i++) {
            trees_x.push(random(0, 1800));
        }
        treePos_y = height / 2 - 38;

        //randomized the fixed values of some objects

        birds = [];
        birds.push(createBirds(144, random(130, 300), random(0.5, 1), 0.5));
        birds.push(createBirds(300, random(130, 300), random(0.5, 1), 0.9));
        birds.push(createBirds(500, random(130, 300), random(0.5, 1), 0.2));


        hedges = [];
        hedges.push(createHedges(50, floorPos_y - 12, 1.1));
        hedges.push(createHedges(290, floorPos_y - 12, 0.7));
        hedges.push(createHedges(500, floorPos_y - 12, 0.5));
        hedges.push(createHedges(790, floorPos_y - 12, 0.9));
        hedges.push(createHedges(900, floorPos_y - 12, 0.7));
        hedges.push(createHedges(1200, floorPos_y - 12, 0.9));
        hedges.push(createHedges(1500, floorPos_y - 12, 0.7));

        flagPole = {
            isReached: false,
            x_pos: 1500
        };

        platforms = [];
        //static platforms
        platforms.push(new Platforms(100, floorPos_y - 80, 100, 0, 0, false));
        platforms.push(new Platforms(250, floorPos_y - 120, 200, 0, 0, false));
        platforms.push(new Platforms(620, floorPos_y - 90, 50, 0, 0, false));
        //moving platforms
        platforms.push(new Platforms(560, floorPos_y - 100, 30, 80, 1, false));
        platforms.push(new Platforms(700, floorPos_y - 70, 70, 300, 3, true));

        enemies = [];
        enemies.push(new Enemy(100, floorPos_y - 10, 100));
        enemies.push(new Enemy(260, floorPos_y - 135, 180));
        enemies.push(new Enemy(1180, floorPos_y - 10, 270));

        blocks = [];
        blocks.push(new Block(100, floorPos_y - 298, 100, 100));
        blocks.push(new Block(250, floorPos_y - 120, 30, 30));
        blocks.push(new Block(450, floorPos_y - 120, 30, 30));
        blocks.push(new Block(590, floorPos_y - 432, 500, 232));

        missiles = [];
        for (let i = 0; i < 8; i++) {
            missiles.push(new Missile(610 + 65 * i, floorPos_y + 50, 300));
        }

        emit = new Emitter(floorPos_y + 5, 0, 10, 15, color(0, 60));
        emit.startEmitter(9000, 20);

        storyText = ["3 -- The Burdened Grove",
            "The pool waits like a mirror, yet I see only the sun in its glare.",
            "The earth sighs, and the roots drink what the light abandons.",
            "The grove remembers every step, every offering, every fall.",
            "\" Eyes of darkness follow me, yet I feel no malice.. only a quiet warning. \""];
    }

    else {
        victory = true;
        storyText = ["\" The grove shudders beneath the sun, and I feel its weight pressing against every step. \""];
        //VICTORY ALL LEVELS COMPLETED
    }
}

//------------------------------------------------------------------// PLAY TESTING / CHEATS FUNCTION //------------------------------------------------------------------//

function cheats() {
    protection = true;
    lives++;
}

//-----------------------------------------------------------// PLAYER INTERACTION CHECKING FUNCTIONS //----------------------------------------------------------//

function keyPressed() {
    // keyCode 67 = "C" and "c"
    if (keyCode == 67) {
        //Enable cheats for playtesting / easier gameplay
        cheats();
    }

    // keyCode 32 = space bar
    if (keyCode == 32) {
        if (!nextScene && !victory) {
            if (sceneCount % 2 == 0) {
                nextScene = true;
            }
            sceneCount++;
        }
        else if (gameOver) {
            bgm.stop();
            startGame();
        }
    }

    //restrict player's movements when game over / win and on cutscenes
    if (!nextScene || flagPole.isReached || gameOver) {
        return;
    }

    // if statements to control the animation of the character when keys are pressed

    //MOVE GAME CHARACTER TO THE LEFT
    // keyCode 65 = "A" and "a"
    if (keyCode == 65) {
        isLeft = true;
    }
    //MOVE GAME CHARACTER TO THE RIGHT 
    // keyCode 68 = "D" and "d"
    if (keyCode == 68) {
        isRight = true;
    }
    //GAME CHARACTER JUMPING ACTION
    // keyCode 87 = "W" and "w"
    //prevent double jump & jumping back up from canyon
    if ((keyCode == 87) && !isFalling && !isPlummeting) {
        gameChar_y -= jumpDistance;
        if (!isFalling) {
            jumpSound.play();
        }
    }
}

function keyReleased() {
    // if statements to control the animation of the character when keys are released.
    if (keyCode == 65 || keyCode == 37) {
        isLeft = false;

    }
    //keycode 68 is D and d
    if (keyCode == 68 || keyCode == 39) {
        isRight = false;
    }
}

//-----------------------------------------------------------// GAME MECHANIC CHECKING FUNCTIONS //---------------------------------------------------------------//

//function for when player receives damage from missile/enemy from contact
function receiveDamage() {
    if (gameOver) {
        return;
    }
    if (protection) {
        protection = false; //deactivate protection when player is protected and touches missile
        immortalityStartTime = frameCount; //record the frame count when immortality starts
    }
    else {
        if (lives > 0 && immortalityStartTime == 1) {
            //decrement player's life by 1 when player touches enemy without protection
            lives--;
            checkGameOver();
            deathSound();
        }
    }
}

function checkPlayerDie() {
    if (gameOver) {
        return;
    }
    //check if game character has fallen off a canyon
    if (gameChar_y > height) {
        //decrement player's lives by 1 when game character has fallen off the canyon
        lives--;
        checkGameOver(); //function to check if user has used up all their lives
        deathSound();
    }
}

function checkGameOver() {
    //check if all lives are used up
    if (lives < 1) {
        gameOver = true;
    }
    else {
        //respawn the game character if there are still lives remaining
        if (!gameOver) {
            startCurrentLevel();
        }
    }
}

function startCurrentLevel() {
    //check if previous level is the same as current level, for example when you win level 2, then previous level will be incremented to 2 
    //in this function u add 1 to your current level
    if (prevLevel == currentLevel) {
        currentLevel++;
        lives = 3; //was initially required to be initialized in setup() in coursera, however is modified to be written here to accomodate levels (lives reset to 3 after each level completion too)
        nextScene = false;
    }//for respawning purposes too
    startLevel();
}

//-----------------------------------------------------------------// SOUND PLAYING FUNCTIONS //------------------------------------------------------------------//

//the creation of this function and none other for playing sounds is because of the death checkers being a special case that would instead require a few copy-pasted codes
function deathSound() {
    if (lives > 0) {
        respawnSound.play();
    }
    else {
        gameOverSound.play();
    }
}

//-----------------------------------------------------------// GAME MECHANIC-BASED DRAWING FUNCTIONS //----------------------------------------------------------//

function drawGameEnd() { //for gameover and level completed checks
    if (victory) {
        return;
    }
    //when player loses / game over ( 0 lives left ) display "game over"
    if (gameOver) {
        push();
        fill(0, 220);
        rect(0, height / 2 - 30, width, 100);
        fill(255, 50);
        textAlign(CENTER);
        textSize(10);
        text("Finding it a bit tough? Press ' C ' on your keyboard (only advised to those who just wants to enjoy the narrative..)", width / 2, height / 2 + 45);
        fill(200, 150);
        textSize(15);
        text("Press ' Space ' to Restart Game.", width / 2, height / 2 + 30); //replacement of the text "Game over. Press space to continue." as per coursera instructions, the change was done to match the theme of the game
        fill(255);
        blendMode(DIFFERENCE);
        textSize(75);
        text("Game Over", width / 2, height / 2 - 10);
        pop();
    }
    else if (flagPole.isReached) {
        //when player reaches flagpole, add 1 to prevLevel
        levelCompleteSound.play();
        prevLevel++; //the incrementation of prevLevel here will lead to the display of level completion screen and press space to continue(for non victories) as per coursera instruction, modified to fit the theme of the game
        totalScore += gameScore;
        prevGameScore = gameScore;
        startCurrentLevel();
    }
}

function drawProtection() {
    if (!protection) {
        return;
    }
    //draw protection bubble when player is protected
    fill(0, 100, 100, 50); // semi-transparent dark cyan
    ellipse(gameChar_x, gameChar_y - 20, 60, 60);

    //draw a shield icon above the character to indicate protection status
    //outer plate of the shield
    push();
    blendMode(DIFFERENCE);
    fill(180);
    rect(gameChar_x, gameChar_y - 80, 12, 12);
    rect(gameChar_x - 12, gameChar_y - 80, 12, 12);
    rect(gameChar_x - 12, gameChar_y - 80 - 12, 12, 12);
    rect(gameChar_x, gameChar_y - 80 - 12, 12, 12);
    rect(gameChar_x - 6, gameChar_y - 80 + 6, 12, 12);
    triangle(gameChar_x - 6, gameChar_y - 80 + 12, gameChar_x - 6, gameChar_y - 80 + 18, gameChar_x - 12, gameChar_y - 80 + 12);
    triangle(gameChar_x + 6, gameChar_y - 80 + 12, gameChar_x + 6, gameChar_y - 80 + 18, gameChar_x + 12, gameChar_y - 80 + 12);
    pop();
    //inner plate of the shield
    fill(225);
    rect(gameChar_x - 8, gameChar_y - 80 - 8, 16, 16);
    rect(gameChar_x - 4, gameChar_y - 80 + 4, 8, 8);
    triangle(gameChar_x - 4, gameChar_y - 80 + 8, gameChar_x - 4, gameChar_y - 80 + 12, gameChar_x - 8, gameChar_y - 80 + 8);
    triangle(gameChar_x + 4, gameChar_y - 80 + 8, gameChar_x + 4, gameChar_y - 80 + 12, gameChar_x + 8, gameChar_y - 80 + 8);
    //shield logo
    fill(120);
    rect(gameChar_x - 2, gameChar_y - 80 - 4, 4, 11);
    rect(gameChar_x - 5, gameChar_y - 80 - 1, 10, 4);
}


//-----------------------------------------------------------// CUTSCENE UI DRAWING FUNCTIONS //------------------------------------------------------------------//

function drawMenuUI() {
    push();
    fill(0, 220);
    rect(0, 0, width, height);

    textSize(17);
    fill(200, 150);
    textAlign(CENTER);
    text("Record # 6145 - What returns with the dawn is born in the dark. ", width / 2, 40);
    if (sceneCount == 1) {
        textSize(13);
        fill(50);
        text("Keyboard controls : ' W ' key to jump, ' A ' key to move left, ' D ' key to move right.", width / 2, height - 65);
        text("Objective : gather skulls and reach the end flag to bring on the sunset.", width / 2, height - 50);
        fill(200, 150);
        text("Press ' Space ' to Start the Harvest", width / 2, height / 2 + 200);
        textSize(100);
        fill(255, 20);
        text("The Quiet Harvest", width / 2, height / 2 + 30);
        text("The Quiet Harvest", width / 2, height / 2 + 60);
        fill(255, 200);
        stroke(255);
        text("The Quiet Harvest", width / 2, height / 2);
    }
    else if (sceneCount % 2 != 0) {
        fill(0, 250);
        rect(width / 2 - 400, height / 2 - 200, 800, 400);

        fill(200, 150);
        var t = "What's Next?"; //replacement of the "Level Complete" text from coursera instructions, change was done to match the theme of the game
        var s = "Total Skulls Collected : ";
        var s_value = totalScore;
        var f = "End of the Harvest.";
        //display a different set of texts on normal level completion
        if (!victory) {
            text("Press ' Space ' to Continue the Harvest", width / 2, height / 2 + 180);
            t = "Day Complete"; //replacement of the "Level Complete" text from coursera instructions, change was done to match the theme of the game
            s = "Skulls Collected : ";
            s_value = prevGameScore;
            f = "log XX | XX | XXXX";
        }
        text(f, width / 2, height / 2 + 150);
        text(storyText[storyText.length - 1], width / 2, height / 2 + 90);
        textSize(100);
        fill(255, 20);
        text(t, width / 2, height / 2 - 120);
        text(t, width / 2, height / 2 - 90);
        fill(255, 200);
        stroke(255);
        text(t, width / 2, height / 2 - 150);

        textSize(20);
        fill(255, 200);
        stroke(255);
        strokeWeight(0.5);
        text(s + s_value, width / 2, height / 2 + 120);
    }
    pop();
}

function dayReminder() {
    push();
    fill(0, 220);
    rect(0, 0, width, height);

    textSize(13);
    fill(200, 150);
    text("Press ' Space '", width - 200, height / 2);
    textSize(30);
    fill(255, 200);
    stroke(255);
    strokeWeight(0.5);
    text("Day " + storyText[0], 100, height / 2);

    pop();
}

function displayText() {
    push();
    textSize(20);
    textAlign(CENTER);
    blendMode(DIFFERENCE);
    fill(255);
    text(storyText[gameScore], width / 2, height - 20);
    pop();
}

//-----------------------------------------------------------// FUNCTIONS OF ANIMATE IN-GAME OBJECTS//------------------------------------------------------------//
function drawGameChar() {
    if (isLeft && isFalling) {
        //body
        fill(40);
        triangle(gameChar_x - 5, gameChar_y - 16, gameChar_x + 25, gameChar_y - 16, gameChar_x + 5, gameChar_y);
        fill(60);
        triangle(gameChar_x - 5, gameChar_y - 16, gameChar_x + 5, gameChar_y, gameChar_x - 3, gameChar_y);
        //head
        fill(255);
        ellipse(gameChar_x, gameChar_y - 18, 24, 19);
        //face
        fill(255);
        triangle(gameChar_x - 15, gameChar_y - 11, gameChar_x - 8, gameChar_y - 15, gameChar_x - 8, gameChar_y - 11);
        //hat
        fill(50);
        ellipse(gameChar_x, gameChar_y - 23, 45, 22);
        triangle(gameChar_x - 11, gameChar_y - 32, gameChar_x + 10, gameChar_y - 50, gameChar_x + 7, gameChar_y - 32);
        fill(40);
        triangle(gameChar_x - 13, gameChar_y - 35, gameChar_x + 7, gameChar_y - 30, gameChar_x - 11, gameChar_y - 24);
    }
    else if (isRight && isFalling) {
        //body
        fill(40);
        triangle(gameChar_x + 5, gameChar_y - 16, gameChar_x - 25, gameChar_y - 16, gameChar_x - 5, gameChar_y);
        fill(60);
        triangle(gameChar_x + 5, gameChar_y - 16, gameChar_x - 5, gameChar_y, gameChar_x + 3, gameChar_y);
        //head
        fill(255);
        ellipse(gameChar_x, gameChar_y - 18, 24, 19);
        //face
        fill(255);
        triangle(gameChar_x + 15, gameChar_y - 11, gameChar_x + 8, gameChar_y - 15, gameChar_x + 8, gameChar_y - 11);
        //hat
        fill(50);
        ellipse(gameChar_x, gameChar_y - 23, 45, 22);
        triangle(gameChar_x + 11, gameChar_y - 32, gameChar_x - 10, gameChar_y - 50, gameChar_x - 7, gameChar_y - 32);
        fill(40);
        triangle(gameChar_x + 13, gameChar_y - 35, gameChar_x - 7, gameChar_y - 30, gameChar_x + 11, gameChar_y - 24);
    }
    else if (isLeft) {
        //body
        fill(40);
        triangle(gameChar_x - 5, gameChar_y - 16, gameChar_x + 5, gameChar_y - 16, gameChar_x + 15, gameChar_y);
        fill(60);
        triangle(gameChar_x - 5, gameChar_y - 16, gameChar_x + 15, gameChar_y, gameChar_x - 5, gameChar_y);
        //head
        fill(255);
        ellipse(gameChar_x, gameChar_y - 21, 24, 19);
        //ears
        fill(200);
        ellipse(gameChar_x + 5, gameChar_y - 19, 7, 12);
        //face
        fill(10);
        ellipse(gameChar_x - 5, gameChar_y - 23, 10, 18);
        fill(255);
        triangle(gameChar_x - 17, gameChar_y - 16, gameChar_x - 10, gameChar_y - 20, gameChar_x - 10, gameChar_y - 16);
        //hat
        fill(50);
        ellipse(gameChar_x, gameChar_y - 26, 45, 15);
        triangle(gameChar_x - 11, gameChar_y - 32, gameChar_x + 15, gameChar_y - 59, gameChar_x + 9, gameChar_y - 32);
        fill(40);
        triangle(gameChar_x - 13, gameChar_y - 38, gameChar_x + 7, gameChar_y - 33, gameChar_x - 11, gameChar_y - 27);
    }
    else if (isRight) {
        //body
        fill(40);
        triangle(gameChar_x + 5, gameChar_y - 16, gameChar_x - 5, gameChar_y - 16, gameChar_x - 15, gameChar_y);
        fill(60);
        triangle(gameChar_x + 5, gameChar_y - 16, gameChar_x - 15, gameChar_y, gameChar_x + 5, gameChar_y);
        //head
        fill(255);
        ellipse(gameChar_x, gameChar_y - 21, 24, 19);
        //ears
        fill(200);
        ellipse(gameChar_x - 5, gameChar_y - 19, 7, 12);
        //face
        fill(10);
        ellipse(gameChar_x + 5, gameChar_y - 23, 10, 18);
        fill(255);
        triangle(gameChar_x + 17, gameChar_y - 16, gameChar_x + 10, gameChar_y - 20, gameChar_x + 10, gameChar_y - 16);
        //hat
        fill(50);
        ellipse(gameChar_x, gameChar_y - 26, 45, 15);
        triangle(gameChar_x - 11, gameChar_y - 32, gameChar_x - 15, gameChar_y - 59, gameChar_x + 9, gameChar_y - 32);
        fill(40);
        triangle(gameChar_x + 13, gameChar_y - 38, gameChar_x - 7, gameChar_y - 33, gameChar_x + 11, gameChar_y - 27);
    }
    else if (isFalling || isPlummeting) {
        //body
        fill(60);
        triangle(gameChar_x - 5, gameChar_y - 13, gameChar_x + 5, gameChar_y - 13, gameChar_x + 5, gameChar_y);
        fill(40);
        triangle(gameChar_x + 20, gameChar_y, gameChar_x + 5, gameChar_y - 13, gameChar_x + 5, gameChar_y);
        triangle(gameChar_x - 5, gameChar_y - 13, gameChar_x + 5, gameChar_y, gameChar_x - 20, gameChar_y);
        //ears
        fill(200);
        ellipse(gameChar_x - 11, gameChar_y - 16, 11, 12);
        ellipse(gameChar_x + 11, gameChar_y - 16, 11, 12);
        //head
        fill(255);
        ellipse(gameChar_x, gameChar_y - 16, 24, 19);
        //hat
        fill(50);
        ellipse(gameChar_x, gameChar_y - 21, 45, 22);
        triangle(gameChar_x - 11, gameChar_y - 27, gameChar_x + 7, gameChar_y - 45, gameChar_x + 9, gameChar_y - 27);
        fill(40);
        triangle(gameChar_x - 13, gameChar_y - 33, gameChar_x + 6, gameChar_y - 27, gameChar_x - 9, gameChar_y - 20);
    }
    else {
        //body
        fill(60);
        triangle(gameChar_x - 5, gameChar_y - 16, gameChar_x + 5, gameChar_y - 16, gameChar_x + 5, gameChar_y);
        fill(40);
        triangle(gameChar_x - 5, gameChar_y - 16, gameChar_x + 5, gameChar_y, gameChar_x - 15, gameChar_y);
        //ears
        fill(200);
        ellipse(gameChar_x - 11, gameChar_y - 20, 11, 12);
        ellipse(gameChar_x + 11, gameChar_y - 20, 11, 12);
        //head
        fill(255);
        ellipse(gameChar_x, gameChar_y - 21, 24, 19);
        //face
        fill(10);
        ellipse(gameChar_x - 6, gameChar_y - 23, 10, 18)
        ellipse(gameChar_x + 6, gameChar_y - 23, 10, 18)
        //hat
        fill(50);
        ellipse(gameChar_x, gameChar_y - 26, 45, 15);
        triangle(gameChar_x - 11, gameChar_y - 32, gameChar_x + 9, gameChar_y - 60, gameChar_x + 9, gameChar_y - 32);
        fill(40);
        triangle(gameChar_x - 13, gameChar_y - 38, gameChar_x + 7, gameChar_y - 32, gameChar_x - 11, gameChar_y - 27);
    }
}

function drawLives(life) { //to keep track of how many lives the player has remaining
    push();
    for (let i = 0; i < life; i++) {
        fill(30);
        ellipse(40 + i * 45, 60, 20);
        ellipse(60 + i * 45, 60, 20);
        ellipse(50 + i * 45, 70, 20);
        triangle(31 + i * 45, 65, 69 + i * 45, 65, 50 + i * 45, 85);
    }
    pop();
}

function displayScore() {
    push();
    fill(255);
    textSize(20);
    blendMode(DIFFERENCE);
    //display the game score
    text("Score: " + gameScore, 100, 30);
    pop();
}

function displayLevel() {
    push();
    fill(0);
    textSize(20);
    stroke(200);
    strokeWeight(2);
    //display the current level
    text("Day " + currentLevel, 15, 30);
    pop();
}

//replacement of the name "renderFlagpole" suggested by coursera for consistency
function drawFlagPole() {
    push();
    strokeWeight(5);
    stroke(200);
    line(flagPole.x_pos, floorPos_y, flagPole.x_pos, floorPos_y - 350);

    fill(200);
    //move flag to the bottom of the pole if flagPole.isReached is true
    //these lines of code cannot be seen in the actual gameplay but the code here is kept (and is working) for coursera requirements.
    if (!flagPole.isReached) {
        rect(flagPole.x_pos, floorPos_y - 350, 50, 30);
    }
    else {
        rect(flagPole.x_pos, floorPos_y - 30, 50, 30);
    }
    pop();
}

function checkFlagPole() { //checkFlagpole (case insensitive), modified for consistency
    //distance between game character and flag pole for flagPole.isReached to be true
    var distance = abs(gameChar_x - flagPole.x_pos);
    if (distance < 5) {
        flagPole.isReached = true;
    }
}

function drawTrees() {
    for (let i = 0; i < trees_x.length; i++) {
        fill(50);
        rect(trees_x[i], treePos_y, 8, 105);
        triangle(trees_x[i], treePos_y + 182, trees_x[i] + 20, treePos_y + 182, trees_x[i], treePos_y + 30);
        triangle(trees_x[i], treePos_y, trees_x[i] + 8, treePos_y, trees_x[i] + 50, treePos_y - 150);
        triangle(trees_x[i] + 15, treePos_y - 30, trees_x[i] + 10, treePos_y - 20, trees_x[i] - 65, treePos_y - 100);
        triangle(trees_x[i] - 15, treePos_y - 50, trees_x[i] - 5, treePos_y - 41, trees_x[i] - 35, treePos_y - 200);
        triangle(trees_x[i] - 35, treePos_y - 200, trees_x[i] - 32, treePos_y - 180, trees_x[i] - 20, treePos_y - 250);
        triangle(trees_x[i] + 45, treePos_y - 130, trees_x[i] + 40, treePos_y - 120, trees_x[i] + 45, treePos_y - 250);
        ellipse(trees_x[i] - 40, treePos_y - 250, 105, 70);
        ellipse(trees_x[i] + 45, treePos_y - 230, 80, 80);
        ellipse(trees_x[i] + 90, treePos_y - 190, 60, 90);
    }
}

function createHedges(x, y, size) {
    var h = {
        x: x,
        y: y,
        size: size,
        draw: function () {
            fill(130)
            ellipse(this.x, this.y, 155 * this.size, 300 * this.size);
            ellipse(this.x + 70 * this.size, this.y - 110 * this.size, 45 * this.size, 50 * this.size);
            ellipse(this.x + 100 * this.size, this.y, 155 * this.size, 220 * this.size);
            ellipse(this.x + 200 * this.size, this.y - 10 * this.size, 105 * this.size, 100 * this.size);
            ellipse(this.x - 100 * this.size, this.y + 30 * this.size, 155 * this.size, 220 * this.size);
            ellipse(this.x - 185 * this.size, this.y + 10 * this.size, 70 * this.size, 80 * this.size);
        }
    }
    return h;
}

function createBirds(x, y, size, speed) {
    var b = {
        x: x,
        y: y,
        size: size,
        speed: speed,
        draw: function () {
            fill(40);
            triangle(this.x - 44 * this.size, this.y - 5 * this.size, this.x + 26 * this.size, this.y, this.x + 29 * this.size, this.y + 10 * this.size);
            triangle(this.x + 29 * this.size, this.y - 30 * this.size, this.x + 14 * this.size, this.y, this.x - 14 * this.size, this.y);
            this.x += this.speed; //animate the birdss
        }
    }
    return b;
}

function createCanyons(x, width) {
    var b = {
        x: x,
        width: width,
        draw: function () {
            fill(10);
            rect(this.x, floorPos_y, this.width, height - floorPos_y);
        },
        checkContact: function (gc_x, gc_y) {
            //detect if the game character walked over the canyon (first 2 conditions combined with &&)
            //also make sure that game chara can jump over the canyon(3rd condition)
            if (gc_x + 5 < this.x + this.width && gc_x - 10 > this.x && gc_y >= floorPos_y) {
                return true;
            }
            return false;
        }
    }
    return b;
}

function Collectable(x, y, isFound) {
    this.x = x;
    this.y = y;
    this.isFound = isFound;

    this.draw = function () {
        //when collectable is collected, make the collectable disappear
        fill(205);
        ellipse(this.x, this.y, 28, 24);
        ellipse(this.x, this.y + 10, 11, 14);
        fill(0);
        ellipse(this.x - 6, this.y + 2, 8, 11);
        ellipse(this.x + 6, this.y + 2, 8, 9);
    }

    this.checkContact = function (gc_x, gc_y) {
        var d = dist(gc_x, gc_y - 20, this.x, this.y);
        if (d < 20) {
            this.isFound = true;
            collectSound.play();
            //increment game score by 1 if character touches collectable
            gameScore++;
        }
    }
}

function Shield(x, y, isFound) {
    this.x = x;
    this.y = y;
    this.isFound = isFound;

    this.draw = function () {
        if (!this.isFound) {
            //outer plate of the shield
            fill(180);
            rect(this.x, this.y, 12, 12);
            rect(this.x - 12, this.y, 12, 12);
            rect(this.x - 12, this.y - 12, 12, 12);
            rect(this.x, this.y - 12, 12, 12);
            rect(this.x - 6, this.y + 6, 12, 12);
            triangle(this.x - 6, this.y + 12, this.x - 6, this.y + 18, this.x - 12, this.y + 12);
            triangle(this.x + 6, this.y + 12, this.x + 6, this.y + 18, this.x + 12, this.y + 12);
            //inner plate of the shield
            fill(225);
            rect(this.x - 8, this.y - 8, 16, 16);
            rect(this.x - 4, this.y + 4, 8, 8);
            triangle(this.x - 4, this.y + 8, this.x - 4, this.y + 12, this.x - 8, this.y + 8);
            triangle(this.x + 4, this.y + 8, this.x + 4, this.y + 12, this.x + 8, this.y + 8);
            //shield logo
            fill(120);
            rect(this.x - 2, this.y - 4, 4, 11);
            rect(this.x - 5, this.y - 1, 10, 4);
        }
    }
    this.checkContact = function (gc_x, gc_y) {
        var d = dist(gc_x, gc_y - 20, this.x, this.y);
        if (d < 20) {
            this.isFound = true;
            protection = true; //activate protection when shield is collected
        }
    }
}

function Enemy(x, y, range) {
    this.x = x;
    this.y = y;
    this.range = range;

    this.currentX = x;
    this.inc = 2;

    this.update = function () {
        this.currentX += this.inc;

        if (this.currentX >= this.x + this.range) {
            this.inc = -2;
        }
        else if (this.currentX < this.x) {
            this.inc = 2;
        }
    }
    this.draw = function () {
        this.update();
        fill(230);
        ellipse(this.currentX, this.y - 15, 30, 30);
        triangle(this.currentX - 15, this.y - 15, this.currentX + 15, this.y - 15, this.currentX - 15, this.y + 10);
        triangle(this.currentX - 15, this.y - 15, this.currentX + 15, this.y - 15, this.currentX, this.y + 10);
        triangle(this.currentX - 15, this.y - 15, this.currentX + 15, this.y - 15, this.currentX + 15, this.y + 10);
        fill(0);
        ellipse(this.currentX - 7, this.y - 15, 10, 13);
        ellipse(this.currentX + 7, this.y - 15, 10, 13);
        if (this.inc < 0) {
            fill(255);
            ellipse(this.currentX + 5, this.y - 15, 5, 5);
            ellipse(this.currentX - 10, this.y - 15, 5, 5);
        }
        else {
            fill(255);
            ellipse(this.currentX - 5, this.y - 15, 5, 5);
            ellipse(this.currentX + 10, this.y - 15, 5, 5);
        }
    }
    this.checkContact = function (gc_x, gc_y) {
        var d = dist(gc_x, gc_y, this.currentX, this.y);
        if (d < 20) {
            return true;
        }
        return false;
    }
}

function Missile(x, y, range) {
    this.x = x;
    this.y = y;
    this.range = range;

    this.currentY = y;
    this.inc = 5;

    this.animateUp = function () {
        this.update();
        fill(0);
        ellipse(this.x, this.currentY + 25, 10, 20);
    }
    this.update = function () {
        this.currentY += this.inc;

        if (this.currentY >= this.y) {
            this.inc = -5;
        }
        else if (this.currentY < this.y - this.range) {
            this.inc = 5;
        }
    }
    this.draw = function () {
        this.update();
        fill(0);
        ellipse(this.x, this.currentY, 20);
        if (this.inc < 0) {
            ellipse(this.x, this.currentY + 15, 10);
            ellipse(this.x, this.currentY + 25, 5);
        }
        else {
            ellipse(this.x, this.currentY - 15, 10);
            ellipse(this.x, this.currentY - 25, 5);
        }
    }
    this.checkContact = function (gc_x, gc_y) {
        var d = dist(gc_x, gc_y, this.x, this.currentY);
        if (d < 20) {
            return true;
        }
        return false;
    }
}

function Gradient(x, y, xSpeed, ySpeed, size, color) {
    this.x = x;
    this.y = y;
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
    this.size = size;
    this.color = color;
    this.age = 0;

    this.drawParticle = function () {
        fill(this.color);
        ellipse(this.x, this.y, this.size);
    }
    this.updateParticle = function () {
        this.x += this.xSpeed;
        this.y += this.ySpeed;
        this.age++;
    }
}

function Emitter(y, xSpeed, ySpeed, size, color) {
    this.y = y;
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
    this.size = size;
    this.color = color;

    this.startParticles = 0;
    this.lifetime = 0;

    this.range = 300;
    this.currentY = y;
    this.inc = 5;

    this.particles = [];

    this.addParticle = function () {
        var p = new Gradient(random(gameChar_x - width / 2, gameChar_x + width / 2),
            random(this.y, this.y + 1),
            random(this.xSpeed - 1, this.xSpeed + 1),
            random(this.ySpeed - 1, this.ySpeed + 1),
            random(this.size - 12, this.size + 2),
            this.color);
        return p;
    }
    this.startEmitter = function (startParticles, lifetime) {
        this.startParticles = startParticles;
        this.lifetime = lifetime;

        //start emitter with initial particles
        for (let i = 0; i < this.startParticles; i++) {
            this.particles.push(this.addParticle());
        }
    }
    this.updateParticles = function () {
        //iterate through particles and draw them to the screen
        var deadParticles = 0;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].drawParticle();
            this.particles[i].updateParticle();
            if (this.particles[i].age > random(0, this.lifetime)) {
                this.particles.splice(i, 1);
                deadParticles++;
            }
        }
        if (deadParticles > 0) {
            //add new particles to replace the dead ones
            for (let i = 0; i < deadParticles; i++) {
                this.particles.push(this.addParticle());
            }
        }
    }
}

function Platforms(x, y, length, range, inc, isMovingHorizontally) {
    this.x = x;
    this.y = y;
    this.length = length;
    this.range = range;
    this.inc = inc;
    this.isMovingHorizontally = isMovingHorizontally;

    this.currentX = x; //for horizontally moving platforms
    this.currentY = y; //for vertically moving platforms

    this.update = function () {
        if (isMovingHorizontally) {
            this.currentX += this.inc;
            if (this.currentX >= this.x + this.range || this.currentX < this.x) {
                this.inc *= -1; //reverse the direction of movement
            }
        }
        else {
            this.currentY += this.inc;
            if (this.currentY >= this.y + this.range || this.currentY < this.y) {
                this.inc *= -1; //reverse the direction of movement
            }
        }
    }
    this.draw = function () {
        if (this.range > 0) {
            this.update(); //for moving platforms
        }
        fill(0);
        rect(this.currentX, this.currentY, this.length, 10);
        fill(50);
        rect(this.currentX, this.currentY - 5, this.length, 3);
    }
    this.checkContact = function (gc_x, gc_y) {
        if (gc_x > this.currentX && gc_x < this.currentX + this.length) {
            var d = this.currentY - gc_y;
            if (d >= 0 && d < 5) {
                return true;
            }
        }
        return false;
    }
}

function Block(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.draw = function () {
        fill(0);
        rect(this.x, this.y, this.width, this.height);
        fill(50);
        rect(this.x - 5, this.y - 5, this.width + 10, 3);
        rect(this.x - 5, this.y - 5, 3, this.height + 10);
        rect(this.x - 5, this.y + this.height + 2, this.width + 10, 3);
        rect(this.x + this.width + 2, this.y - 5, 3, this.height + 10);
    }
    this.checkContact = function (gc_x, gc_y) {
        //as a platform only when landed on the block from above it
        if (gc_x > this.x && gc_x < this.x + this.width) {
            var d = this.y - gc_y;
            if (d >= 0 && d < 5) {
                return true;
            }
        }
        //as a block for from horizontal sides interaction
        if ((gc_y > this.y && gc_y < this.y + this.height)
            && (gc_x + 10 > this.x && gc_x + 10 < this.x + this.width || gc_x - 10 > this.x && gc_x - 10 < this.x + this.width)) {
            isBlocked = true;
        }
        return false;
    }
}
//end of code written by Kellyn Joycelee