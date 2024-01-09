    window.onload = function() {
        function $(idName) {
            return document.getElementById(idName);
        }

        function getStyle(ele, attr) {
            var res = null;
            if (ele.currentStyle) {
                res = ele.currentStyle[attr];
            } else {
                res = window.getComputedStyle(ele, null)[attr];
            }
            return parseFloat(res);
        }

        var game = $("game"),
            gameStart = $("gameStart"),
            gameEnter = $("gameEnter"),
            player = $("player"),
            bulletsP = $("bullets"), // Fixed typo here
            enemysP = $("enemys"),
            s = $("scores").firstElementChild.firstElementChild;

        var playerImage = player.querySelector("img"); // Select the image element inside #player
        var originalImageSrc = playerImage.src; // Keep track of the original image source
        var leftImageSrc = "./img/Player_L.png"; // Set the path to the left-facing image
        var rightImageSrc = "./img/Player_R.png";
    
        var lastMouseX = 0;
        var sensitivity = 2; // Adjust this value to set the sensitivity
        var delayTimer = null; // Timer for the delay
    
        document.addEventListener("mousemove", function(evt) {
            if(!gameStatus) return;
            var e = evt || window.event;
            var mouseX = e.clientX; // Get the X coordinate of the mouse pointer
    
            // Check if the mouse movement exceeds the sensitivity threshold
            if (Math.abs(mouseX - lastMouseX) > sensitivity) {
                clearTimeout(delayTimer); // Clear the delay timer if it's already running
    
                // Check if the mouse is moving to the left (direction)
                if (mouseX < lastMouseX) {
                    playerImage.src = leftImageSrc; // Change the image to the left-facing one
                } else {
                    playerImage.src = rightImageSrc; // Change the image to the right-facing one
                }
    
                lastMouseX = mouseX; // Update lastMouseX for the next comparison
            } else {
                // If the movement is less than sensitivity, set a delay to revert to the original image
                delayTimer = setTimeout(function() {
                    playerImage.src = originalImageSrc; // Revert to the original image
                }, 20); // Set your desired delay time in milliseconds (here it's set to 500ms)
            }
        });
        
        var gameWidth = getStyle(game, "width"),
            gameHeight = getStyle(game, "height");

        var gameMarginLeft = getStyle(game, "marginLeft"),
            gameMarginTop = getStyle(game, "marginTop");

        var playerWidth = getStyle(player, "width"),
            playerHeight = getStyle(player, "height");

        var bulletWidth = 6,
            bulletHeight = 14;

        const resumeButton = document.getElementById('resumeButton');


        var gameStatus = false, //current game stat
            a = null, //timer for creating the bullet
            b = null, //timer for creating the enemy
            c = null, // timer for background
            backgroundPY = 0, // background poistion Y value
            bullets = [], //list of all bullet;
            enemys = [], //list of all enemy
            scores =0; //score

        function togglePauseScreen() {
            pauseScreen.style.display = pauseScreen.style.display === 'none' ? 'flex' : 'none';
        }
        gameStart.firstElementChild.onclick = function() {
            gameStart.style.display = "none";
            gameEnter.style.display = "block";

            // Add mousemove event listener for player movement
            document.onkeyup  = function(evt){
                var e = evt || window.event;
                var keyVal = e.keyCode;
                if(keyVal == 32){
                    if(!gameStatus){
                        //intinat score
                        scores = 0;
                        togglePauseScreen(); 
                        // game start
                        this.onmousemove = playerplaneMove;
                        //start moving background;
                        bgMovement();
                        //active shot
                        shot();
                        //enemy appear
                        appearEnemy();
                        //resume
                        //bullet movement
                        if(bullets.length != 0)resume(bullets,1);
                        //enemy movement
                        if(enemys.length != 0) resume(enemys)
                    }else{
                        //pause game
                        this.onmousemove = null;
                        togglePauseScreen(); 
                        //clear create enemy and create bullet timer
                        clearInterval(a);
                        clearInterval(b);
                        clearInterval(c);
                        a = null;
                        b = null;
                        //clear the movement of all bullet and enemy timer
                        clear(bullets);
                        clear(enemys);
                    }
                    gameStatus = !gameStatus;
                }
            }
        };
    
        function playerplaneMove(evt) {
            var e = evt || window.event;
            var mouse_x = e.x || e.pageX,
                mouse_y = e.y || e.pageY;

            
            var last_player_left = mouse_x - gameMarginLeft - playerWidth / 2,
                last_player_top = mouse_y - gameMarginTop - playerHeight / 2;
            //Insure plane cant get out of current page
            if(last_player_left<=0){
                last_player_left = 0;
            }else if(last_player_left >= gameWidth - playerWidth){
                last_player_left = gameWidth - playerWidth;
            }
            if (last_player_top <= 0){
                last_player_top = 0;
            }else if (last_player_top >=  gameHeight - playerHeight){
                last_player_top = gameHeight - playerHeight;
            }

            player.style.left = last_player_left + "px";
            player.style.top = last_player_top + "px";
        }
        //create a bullet in unit time
        function shot(){
            if(a) return;
            a = setInterval(function(){
                //creating bullet
                createBullet();
            },100)
        }
        //create bullet
        function createBullet(){
            var bullet = new Image();
            bullet.src = "img/Bullet.png";
            bullet.className = "b";
            //confirm bullet loction
            var playerL = getStyle(player,"left"),
                playerT = getStyle(player,"top");

                var bulletL = playerL + playerWidth/2 - bulletWidth/2,
                    bulletT = playerT + bulletHeight;

                bullet.style.left= bulletL + "px";
                bullet.style.top =  bulletT + "px";
                bulletsP.appendChild(bullet);
                bullets.push(bullet);
                move(bullet,"top");

        }
        //bullet movement:const movement
        function move(ele, attr){
            var speed = -8;

            ele.timer = setInterval(function(){
                var moveVal = getStyle(ele,attr);
                //bullet movement out of the screen, clear that bullet timer and delect that bullet
                if(moveVal <= -bulletHeight){
                    clearInterval(ele.timer);
                    ele.parentNode.removeChild(ele);
                    bullets.splice(0,1);
                }else{
                    ele.style[attr] =moveVal + speed + "px";
                }

            },10)

        }
        //create enemy data object
        var enemysObj = {
            enemy1:{
                width:28,
                height:25,
                score:100,
                hp :100

            },
            enemy2:{
                width:28,
                height:25,
                score:500,
                hp :800
            },
            enemy3:{
                width:66,
                height:66,
                score:2000,
                hp :2000
            }
        }
        function appearEnemy(){
            if(b) return;
            b  = setInterval(function(){
                createEnemy();
                //delete enemy
                delEnemy();
            },1000)
        }

        function createEnemy(){
            var percentData = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3];
            var enemyType = percentData[Math.floor(Math.random()*percentData.length)];
            var enemyData = enemysObj["enemy"+ enemyType];
            
            var enemy = new Image(enemyData.width, enemyData.height);
            enemy.src = "img/Enemy" + enemyType + ".png";
            enemy.t= enemyType;
            enemy.score = enemyData.score;
            enemy.hp = enemyData.hp; 
            enemy.className="e"
            enemy.dead =false; // still alive
            var enemyL = Math.floor(Math.random()*(gameWidth-enemyData.width+1)),
                enemyT = -enemyData.height;
            enemy.style.left = enemyL + "px";
            enemy.style.top = enemyT + "px";
            enemysP.appendChild(enemy); // Fixed variable name to append the enemy element
            enemysP.appendChild(enemy);
            enemys.push(enemy);
            enemyMovement(enemy,"top");
        }
        
        function enemyMovement(ele,attr){
            var speed = null;
            if(ele.t==1){
                speed = 1.5;
            }else if(ele.t == 2){
                speed = 1;
            }else{
                speed = 0.5;
            }
            ele.timer = setInterval(function(){
                var moveVal = getStyle(ele,attr);
                if(moveVal >= gameHeight){
                    clearInterval(ele.timer);
                    enemysP.removeChild(ele);
                    var index = indexOf(ele,enemys);
                    if(index >= 0){
                        enemys.splice(index,1);
                    }
                }
                else{
                    ele.style[attr] = moveVal + speed + "px";
                    //Check for collision with bullet for every moving plane
                    danger(ele);
                    //check collision with player
                    gameover(); 
                }
            },10);
        }
        //clear timer on movement of bullet and enemy

        function clear(childs){
            for(var i = 0;i<childs.length;i++){
                clearInterval(childs[i].timer);
            }
        }
        //resume the game
        function resume(childs, type){
            for(var i = 0 ; i < childs.length;i++){
                type == 1 ? move(childs[i],"top") :enemyMovement(childs[i],"top")
            }
        }
        function indexOf(val, arr){
            for(var i = 0 ;i < arr.length;i++){
                if(arr[i] == val) return i;
            }
            return -1;
        }
        //Movement of background after Game start
        function bgMovement(){
            c = setInterval(function(){
                backgroundPY += 0.5;
                if(backgroundPY >= gameHeight){
                    backgroundPY = 0;
                }
                gameEnter.style.backgroundPositionY = backgroundPY+"px";
            },10)
        }
        //detect collision between bullet and airplane
        function danger(enemy){
            for(var i = 0; i< bullets.length;i++){
                // get bullet left top margin
                var bulletL =  getStyle(bullets[i],"left"),
                    bulletT = getStyle(bullets[i],"top");
                //get enemy top left margin

                var enemyL = getStyle(enemy,"left"),
                    enemyT = getStyle(enemy,"top");
                
                    //get enemy aircraft length x width
                var enemyWidth = getStyle(enemy,"width"),
                    enemyHeight = getStyle(enemy,"height");
                var conditon   = bulletL + bulletWidth >= enemyL && bulletL <= enemyL + enemyWidth &&bulletT <=enemyT + enemyHeight && bulletT + bulletHeight >= enemyT;

                if(conditon){
                    //collision happen, delete bullet
                    
                    clearInterval(bullets[i].timer);
                    bulletsP.removeChild(bullets[i]);
                    bullets.splice(i,1);

                    //collision happen, decrease the health of enemy, when health == 0, delete enemy

                    enemy.hp-=100;
                
                    if(enemy.hp == 0){
                        //delete enemy
                        clearInterval(enemy.timer);
                        enemy.src = "./img/explosion_by_benthedwarf_d6bbrxe.gif"
                        //mark dead enemy
                        enemy.dead = true;
                        //calc score
                        scores += enemy.score;
                        s.innerHTML = scores;
                    }

                }
            }


        }
        //from create enemy delete enemy in the list and the document with delay
        function delEnemy(){
            for(var i = enemys.length -1; i>=0;i--){
                if(enemys[i].dead){
                    (function(index){
                        //delete dead enemy element from the document
                        enemysP.removeChild(enemys[index]);
                        //delete from list of enemys
                        enemys.splice(index,1);
                    })(i)
                }
            }
        }
        function gameover(){
            for(var i =0;i<enemys.length;i++){
                if(!enemys[i].dead){ // if the enemy still alive in the console
                    //check for collision
                    var enemyL = getStyle(enemys[i],"left"),
                        enemyT = getStyle(enemys[i],"top");

                    var enemyW = getStyle(enemys[i],"width"),
                        enemyH = getStyle(enemys[i],"height");

                    var playerL = getStyle(player,"left"),
                        playerT = getStyle(player, "top");

                    var condition = playerL + playerWidth >= enemyL && 
                        playerL <= enemyL + enemyW && 
                        playerT <= enemyT + enemyH && 
                        playerT + playerHeight >= enemyT;
        
                    if (condition) { // collision happened
                        //clear timer: bullet, enemy, and background timer remove
                        clearInterval(a);
                        clearInterval(b);
                        clearInterval(c);
                        a = null;
                        b = null;
                        c = null;
                        remove(bullets);
                        remove(enemys);
                        
                        //clear list

                        bullets = [];
                        enemys = [];
                        // tell the suer score
                        alert("Game Over: " + scores + "points");

                        //clear player movement event
                        document.onmousemove = null;
                        //back to start game page
                        gameStart.style.display = "block";
                        gameEnter.style.display = null;
                        player.style.left = "127px";
                        player.style.top = gameHeight - playerHeight + "px";
                        s.innerHTML = 0;
                    }
        

                }
            }
        }
        function remove(childs){
            for(var i = childs.length-1;i>=0;i--){
                clearInterval(childs[i].timer);
                childs[i].parentNode.removeChild(childs[i]);
            }
        }
    };
