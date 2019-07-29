
  var sliderRange = {begin:-1, end: -1};
  var selectedFuel = ["Electricity", "Diesel", "Gasoline"];
  var colorScale;

  var highlight = function(d){
    // reduce opacity of all groups
    d3.selectAll(".bubbles").transition().duration(1000).style("opacity", 0.02)
    // expect the one that is hovered
    d3.selectAll("."+d).transition().duration(1000).style("opacity", 1)
  }

  // And when it is not hovered anymore
  var noHighlight = function(d){
    d3.selectAll(".bubbles").transition().duration(1000).style("opacity", 1)
  }

  var groups;
  var margin = {top: 50, right: 150, bottom: 50, left: 50},
    width = 700 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
  var moving = false;

  var xValue = function(d) { return d.AverageCityMPG; }
 var xScale = d3.scaleLinear().domain([0,10,12,14,16,18,20,25,30,150]).range([0,20,50,100,200,250,300,350,400,width]);
 var xMap = function(d) { return xScale(xValue(d));}
 
 //setup y
  var yValue = function(d) { return d.AverageHighwayMPG; }
 //var yScale = d3.scaleLinear().domain([10,12,14,16,18,20,25,30,150]).range([height, 700, 600, 450, 400,300,200,100,0]);
 var yScale = d3.scaleLinear().domain([10,20,30,50,100,150]).range([height,400,300,200,100,0]);
 var yMap = function(d) { return yScale(yValue(d));}
 
//setup width
var dValue = function(d) { return d.EngineCylinders;}
var dMap = function(d) { return Math.max(5,  5 + dValue(d));}

var playButton, slider;
var timer;
var showTooltip, hideTooltip, moveTooltip;


async function init() {
//width:700 right:150
   
    //set svg
    svg = d3.select("#my_dataviz")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");

    //read data
    data = await d3.csv("https://flunky.github.io/cars2017.csv");
    groups = [...new Set(data.map(b => b.Make))];


    data.forEach(element => {
        element.AverageCityMPG = +element.AverageCityMPG;
        element.AverageHighwayMPG = +element.AverageHighwayMPG;
        element.EngineCylinders = +element.EngineCylinders;
    });

//setup scene button
var sceneButtons = d3.selectAll(".clsBtnScenes").on("click", function(){
    var button = d3.select(this);
    var val = button.attr("value");
    var btnId = button.attr("id");
    
    UpdateSlideFromScene(val);
    //update the scene message
    divMessage.html("");
    
    if(btnId == "btnScene1" )
        divMessage.html("<label style='font-weight:bold'>Page 1</label><br/>" + 
            "Electric cars are having no cylinders and so they give better MPG as its MPG is measured to cover miles per full charge. "    
        );
    
    if(btnId == "btnScene2")
        divMessage.html("<label style='font-weight:bold'>Page 2</label><br/>" + 
            "Cars with less cylinders tend to give better MPG. This range does not cover the electic cars. It is noted a linear relation with # of Cylinders and Average City MPG."    
        );
    
    if(btnId == "btnScene3" )
        divMessage.html("<label style='font-weight:bold'>Page 3</label><br/>" + 
        "Cars with less cylinders tend to give better MPG. This range does not cover the electic cars. It is noted a linear relation with # of Cylinders and Average City MPG." +   
        "<br/><br/>As expected, you see bigger circles towards the origin (0,0) as they reflect the cars with more cylinders."    
        );
    
});

//setup play button
playButton = d3.select("#playButton");
playButton.on("click", function() {
    var button = d3.select(this);
    if (button.text() == "Pause") {
      moving = false;
      clearInterval(timer);
      // timer = 0;
      button.text("Play");
    } else {
      moving = true;
      if(sliderRange.end == 12)
      {
        sliderRange.end = 0;
        sliderRange.begin = 0;
      }
      timer = setInterval(SliderStep, 1500);
      button.text("Pause");
    }
   
});

//scene meesage
divMessage = d3.select("#divMessage");


 //setup x
 

// Add a scale for bubble color
colorScale = d3.scaleOrdinal()
    .domain(groups)
    .range(d3.schemeSet2);


    // Add X axis
    var x = d3.scaleLinear()
        .domain([0,150])
        .range([0,width]);
    svg.append("g")
        .attr("transform", "translate(0," + width + ")")
        .call(d3.axisBottom(xScale));

     // Add X axis label:
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height+40 )
      .text("Average Highway MPG");

  // Add Y axis
    var y = d3.scaleLinear()
        .domain([0,150])
        .range([ height, 0]);
    svg.append("g")
        //.call(d3.axisLeft(y));
        .call(d3.axisLeft(yScale));


    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", -10 )
      .text("Average City MPG")
      .attr("text-anchor", "start")


// -1- Create a tooltip div that is hidden by default:
var tooltip = d3.select("#my_dataviz")
    .append("div")
      .style("opacity", 0)
      .attr("class", "tooltipCss")
      //.style("background-color", "black")
      //.style("border-radius", "5px")
      //.style("padding", "10px")
      //.style("color", "white")
      //.style("position", "absolute")
      //.style("overflow", "auto")
      //.style("z-index", "10");

// -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
showTooltip = function(d) {
    tooltip
      .transition()
      .duration(200)
    tooltip
      .style("opacity", 1)
      .html("<div>" + "<b>Maker:</b> " + d.Make + "<br/>" + 
            "<b>Type:</b> " + d.Fuel + "<br/>" +            
            "<b>Cylinders:</b> " + d.EngineCylinders + "</br>" +
            "<b>Avg. Highway MPG:</b> " + d.AverageHighwayMPG + "</br>" + 
            "<b>Avg. City MPG:</b> " + d.AverageCityMPG + "</div>")
      //.style("left", (d3.event.pageX + 10) + "px")
      //.style("top", (d3.event.pageY-10) + "px")
      //.style("left", (d3.mouse(this)[0]+30) + "px")
      //.style("top", (d3.mouse(this)[1]+30) + "px")
      //.style('top', (d3.event.layerY + 10) + 'px') // always 10px below the cursor
      //.style('left', (d3.event.layerX + 10) + 'px')
      .style("display", "inline-block");
  };

moveTooltip = function(d) {
    tooltip
    //.style("left", (d3.mouse(this)[0]+30) + "px")
     // .style("top", (d3.mouse(this)[1]+30) + "px")
      .style('top', (d3.event.layerY + 10) + 'px') // always 10px below the cursor
      .style('left', (d3.event.layerX + 10) + 'px')
    
};

hideTooltip = function(d) {
    tooltip
      //.transition()
      //.duration(500)
      //.style("opacity", 0)
      .style("display", "none");
  };


  


///highlight labels

//event handler for all checkboxes

d3.selectAll(".checkbox").on("change", function()
{
  d3.selectAll(".checkbox").each(function(d){
    cb = d3.select(this);
    val = cb.property("value");
    if(cb.property("checked"))
    {
      if(!selectedFuel.includes(val))
        selectedFuel.push(val);
    }
    else
    {
      if(selectedFuel.includes(val))
      {
        for( var i = 0; i < selectedFuel.length; i++){ 
          if ( selectedFuel[i] === val) {
            selectedFuel.splice(i, 1); 
          }
        }
      }      
    }
    }   
  );
  DrawData(svg, xMap, yMap, dMap, showTooltip,hideTooltip,moveTooltip);
});

//slider

  slider = createD3RangeSlider(0, 12, "#slider-container");
    slider.range(0,0);
    slider.onChange(function(newRange){
        UpdateSliderAndDraw(svg, newRange, xMap, yMap, dMap, showTooltip,hideTooltip,moveTooltip);       
  });  
  
  
 DrawData(svg,  xMap, yMap, dMap, showTooltip,hideTooltip,moveTooltip);

}

function UpdateSliderAndDraw(svg, newRange, xMap, yMap, dMap, showTooltip,hideTooltip,moveTooltip)
{
    d3.select("#range-label")
        .text("Selected Cylinder Range : " + newRange.begin + " - " + newRange.end)
        .attr("text-anchor", "left")
        //.attr("font-family", "sans-serif")
        .attr("font-size", "10px")
        .attr("font-weight", "bold");
    sliderRange.begin = newRange.begin;
    sliderRange.end = newRange.end;
    DrawData(svg, xMap, yMap, dMap, showTooltip,hideTooltip,moveTooltip);
}

function SliderStep() {
    var newRange = sliderRange;
    //update(x.invert(currentValue));
    if (sliderRange.end == 12) {
        moving = false;
        clearInterval(timer);
        playButton.text("Play");
    }
    else
    {
        newRange.end = newRange.end + 1;
        slider.range(newRange.begin, newRange.end);
        //UpdateSliderAndDraw(svg, newRange, xMap, yMap, dMap, showTooltip,hideTooltip,moveTooltip);
    }   
}

function UpdateSlideFromScene(end)
{
    var newRange = sliderRange;
    //update(x.invert(currentValue));

    //remove all
    //svg.selectAll(".bubbles").transition().duration(100).remove();
    
    newRange.end = +end;
    newRange.begin = 0;
    slider.range(newRange.begin, newRange.end);   
}

function DrawHighlight(svg, coveredMakers)
{
  var size = 20
  svg.selectAll(".labelCircle").remove();
  var highlightCircles =  svg.selectAll(".labelCircle")
     .data(coveredMakers);
     
     highlightCircles.enter()
     .append("circle")
       .attr("class", "labelCircle")
       .attr("cx", function(d,i) { return width + 20; })
       .attr("cy", function(d,i){ return (10 + i*(size+2));  }) // 100 is where the first dot appears. 25 is the distance between dots
       .attr("r", 5)
       .style("fill", function(d){ return colorScale(d)})
       .style("opacity", "1")
       .on("mouseover", highlight)
       .on("mouseleave", noHighlight);
     
      highlightCircles.exit().remove();//style("opacity", "0.2");

    // Add labels beside legend dots
    svg.selectAll(".txtLabel").remove();
    var highlightLabels = svg.selectAll(".txtLabel")      
        .data(coveredMakers);
        highlightLabels.enter()
        .append("text")
        .attr("class", "txtLabel")
        .attr("x", function(d,i) { return width + 20 + size*.8;})
        .attr("y", function(d,i){ return i * (size + 2) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ return colorScale(d)})
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style("opacity", "1")
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight);
        highlightLabels.exit().remove();//style("opacity", "0.2");
}

function DrawData(svg, xMap, yMap, dMap, showTooltip,hideTooltip,moveTooltip)
{

  var updatedData = data.filter(function(d){
          return d.EngineCylinders >=  sliderRange.begin && d.EngineCylinders <= sliderRange.end &&
                  selectedFuel.includes(d.Fuel);              
        });
  var coveredMakers = [...new Set(updatedData.map(b => b.Make))];
 
  colorScale = d3.scaleOrdinal()
    .domain(coveredMakers)
    .range(d3.schemeSet2);

    svg//.append("g")
        .selectAll(".bubbles")
        .remove();

  var selection = svg//.append("g")
    .selectAll(".bubbles")
    .data(updatedData);
    selection
      .enter().append("circle")
      .attr("class", function(d) { return "bubbles " + d.Make + " " + d.Fuel + " " + d.EngineCylinders;})
      .attr("cx", xMap)
      .attr("cy", yMap)
      .attr("r", dMap)
      .style("fill", "white")
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip)
      .on("mousemove", moveTooltip)
      .transition().duration(1000)
      .style("fill", function (d) { return colorScale(d.Make); } )
      .style("opacity", "1")
      .attr("stroke", "white")
      .style("stroke-width", "2px")
     
    ;
    selection.exit().remove();

    //draw highlight
    DrawHighlight(svg, coveredMakers);
    //highlight labels 
 
}


function createD3RangeSlider (rangeMin, rangeMax, containerSelector, playButton) {
    "use strict";

    var minWidth = 10;

    var sliderRange = {begin: rangeMin, end: rangeMin};
    var changeListeners = [];
    var touchEndListeners = [];
    var container = d3.select(containerSelector);
    var playing = false;
    var resumePlaying = false; // Used by drag-events to resume playing on release
    var playingRate = 100;
    var containerHeight = container.node().offsetHeight;

    // Set up play button if requested
    if (playButton) {
       
        var box = container.append("div")
            .style("display", "box")
            .style("display", "-moz-box")
            .style("display", "-webkit-box")
            .style("box-orient", "horizontal")
            .style("-moz-box-orient", "horizontal")
            .style("-webkit-box-orient", "horizontal");

        var playBox = box.append("div")
            .style("width", containerHeight + "px")
            .style("height", containerHeight + "px")
            .style("margin-right", "10px")
            .style("box-flex", "0")
            .style("-moz-box-flex", "0")
            .style("-webkit-box-flex", "0")
            .classed("play-container", true);

        var sliderBox = box.append("div")
            .style("position", "relative")
            .style("min-width", (minWidth*2) + "px")
            .style("height", containerHeight + "px")
            .style("box-flex", "1")
            .style("-moz-box-flex", "1")
            .style("-webkit-box-flex", "1")
            .classed("slider-container", true);

        var playSVG = playBox.append("svg")
            .attr("width", containerHeight + "px")
            .attr("height", containerHeight + "px")
            .style("overflow", "visible");

        var circleSymbol = playSVG.append("circle")
            .attr("cx", containerHeight / 2)
            .attr("cy", containerHeight / 2)
            .attr("r", containerHeight / 2)
            .classed("button", true);

        var h = containerHeight;
        var stopSymbol = playSVG.append("rect")
            .attr("x", 0.3*h)
            .attr("y", 0.3*h)
            .attr("width", 0.4*h)
            .attr("height", 0.4*h)
            .style("visibility", "hidden")
            .classed("stop", true);

        var playSymbol = playSVG.append("polygon")
            .attr("points", (0.37*h) + "," + (0.2*h) + " " + (0.37*h) + "," + (0.8*h) + " " + (0.75*h) + "," + (0.5*h))
            .classed("play", true);

        //Circle that captures mouse interactions
        playSVG.append("circle")
            .attr("cx", containerHeight / 2)
            .attr("cy", containerHeight / 2)
            .attr("r", containerHeight / 2)
            .style("fill-opacity", "0.0")
            .style("cursor", "pointer")
            .on("click", togglePlayButton)
            .on("mouseenter", function(){
                circleSymbol
                    .transition()
                    .attr("r", 1.2 * containerHeight / 2)
                    .transition()
                    .attr("r", containerHeight / 2);
            });


    } else {
        var sliderBox = container.append("div")
            .style("position", "relative")
            .style("height", containerHeight + "px")
            .style("min-width", (minWidth*2) + "px")
            .classed("slider-container", true);
    }

    //Create elements in container
    var slider = sliderBox
        .append("div")
        .attr("class", "slider");
    var handleW = slider.append("div").attr("class", "handle WW");
    var handleE = slider.append("div").attr("class", "handle EE");

    /** Update the `left` and `width` attributes of `slider` based on `sliderRange` */
    function updateUIFromRange () {
        var conW = sliderBox.node().clientWidth;
        var rangeW = sliderRange.end - sliderRange.begin;
        var slope = (conW - minWidth) / (rangeMax - rangeMin);
        var uirangeW = minWidth + rangeW * slope;
        var ratio = (sliderRange.begin - rangeMin) / (rangeMax - rangeMin - rangeW);
        if (isNaN(ratio)) {
            ratio = 0;
        }
        var uirangeL = ratio * (conW - uirangeW);

        slider
            .style("left", uirangeL + "px")
            .style("width", uirangeW + "px");
    }

    /** Update the `sliderRange` based on the `left` and `width` attributes of `slider` */
    function updateRangeFromUI () {
        var uirangeL = parseFloat(slider.style("left"));
        var uirangeW = parseFloat(slider.style("width"));
        var conW = sliderBox.node().clientWidth; //parseFloat(container.style("width"));
        var slope = (conW - minWidth) / (rangeMax - rangeMin);
        var rangeW = (uirangeW - minWidth) / slope;
        if (conW == uirangeW) {
            var uislope = 0;
        } else {
            var uislope = (rangeMax - rangeMin - rangeW) / (conW - uirangeW);
        }
        var rangeL = rangeMin + uislope * uirangeL;
        sliderRange.begin = Math.round(rangeL);
        sliderRange.end = Math.round(rangeL + rangeW);

        //Fire change listeners
        changeListeners.forEach(function (callback) {
            callback({begin: sliderRange.begin, end: sliderRange.end});
        });
    }

    // configure drag behavior for handles and slider
    var dragResizeE = d3.drag()
        .on("start", function () {
            d3.event.sourceEvent.stopPropagation();
            resumePlaying = playing;
            playing = false;
        })
        .on("end", function () {
            if (resumePlaying) {
                startPlaying();
            }
            touchEndListeners.forEach(function (callback) {
                callback({begin: sliderRange.begin, end: sliderRange.end});
            });
        })
        .on("drag", function () {
            var dx = d3.event.dx;
            if (dx == 0) return;
            var conWidth = sliderBox.node().clientWidth; //parseFloat(container.style("width"));
            var newLeft = parseInt(slider.style("left"));
            var newWidth = parseFloat(slider.style("width")) + dx;
            newWidth = Math.max(newWidth, minWidth);
            newWidth = Math.min(newWidth, conWidth - newLeft);
            slider.style("width", newWidth + "px");
            updateRangeFromUI();
        });

    var dragResizeW = d3.drag()
        .on("start", function () {
            this.startX = d3.mouse(this)[0];
            d3.event.sourceEvent.stopPropagation();
            resumePlaying = playing;
            playing = false;
        })
        .on("end", function () {
            if (resumePlaying) {
                startPlaying();
            }
            touchEndListeners.forEach(function (callback) {
                callback({begin: sliderRange.begin, end: sliderRange.end});
            });
        })
        .on("drag", function () {
            var dx = d3.mouse(this)[0] - this.startX;
            if (dx==0) return;
            var newLeft = parseFloat(slider.style("left")) + dx;
            var newWidth = parseFloat(slider.style("width")) - dx;

            if (newLeft < 0) {
                newWidth += newLeft;
                newLeft = 0;
            }
            if (newWidth < minWidth) {
                newLeft -= minWidth - newWidth;
                newWidth = minWidth;
            }

            slider.style("left", newLeft + "px");
            slider.style("width", newWidth + "px");

            updateRangeFromUI();
        });

    var dragMove = d3.drag()
        .on("start", function () {
            d3.event.sourceEvent.stopPropagation();
            resumePlaying = playing;
            playing = false;
        })
        .on("end", function () {
            if (resumePlaying) {
                startPlaying();
            }
            touchEndListeners.forEach(function (callback) {
                callback({begin: sliderRange.begin, end: sliderRange.end});
            });
        })
        .on("drag", function () {
            var dx = d3.event.dx;
            var conWidth = sliderBox.node().clientWidth; //parseInt(container.style("width"));
            var newLeft = parseInt(slider.style("left")) + dx;
            var newWidth = parseInt(slider.style("width"));

            newLeft = Math.max(newLeft, 0);
            newLeft = Math.min(newLeft, conWidth - newWidth);
            slider.style("left", newLeft + "px");

            updateRangeFromUI();
        });

    handleE.call(dragResizeE);
    handleW.call(dragResizeW);
    slider.call(dragMove);

    //Click on bar
    sliderBox.on("mousedown", function (ev) {
        var x = d3.mouse(sliderBox.node())[0];
        var props = {};
        var sliderWidth = parseFloat(slider.style("width"));
        var conWidth = sliderBox.node().clientWidth; //parseFloat(container.style("width"));
        props.left = Math.min(conWidth - sliderWidth, Math.max(x - sliderWidth / 2, 0));
        props.left = Math.round(props.left);
        props.width = Math.round(props.width);
        slider.style("left", props.left + "px")
            .style("width", props.width + "px");
        updateRangeFromUI();
    });

    //Reposition slider on window resize
    window.addEventListener("resize", function () {
        updateUIFromRange();
    });

    function onChange(callback){
        changeListeners.push(callback);
        return this;
    }

    function onTouchEnd(callback){
        touchEndListeners.push(callback);
        return this;
    }

    function setRange (b, e) {
        sliderRange.begin = b;
        sliderRange.end = e;

        updateUIFromRange();

        //Fire change listeners
        changeListeners.forEach(function (callback) {
            callback({begin: sliderRange.begin, end: sliderRange.end});
        });
    }


   
    function range(b, e) {
        var rLower;
        var rUpper;

        if (typeof b === "number" && typeof e === "number") {

            rLower = Math.min(b, e);
            rUpper = Math.max(b, e);

            //Check that lower and upper range are within their bounds
            if (rLower < rangeMin || rUpper > rangeMax) {
                console.log("Warning: trying to set range (" + rLower + "," + rUpper + ") which is outside of bounds (" + rangeMin + "," + rangeMax + "). ");
                rLower = Math.max(rLower, rangeMin);
                rUpper = Math.min(rUpper, rangeMax);
            }

            //Set the range
            setRange(rLower, rUpper);
        } else if (typeof b === "number") {

            rLower = b;
            var dif = sliderRange.end - sliderRange.begin;
            rUpper = rLower + dif;

            if (rLower < rangeMin) {
                console.log("Warning: trying to set range (" + rLower + "," + rUpper + ") which is outside of bounds (" + rangeMin + "," + rangeMax + "). ");
                rLower = rangeMin;
            }
            if(rUpper > rangeMax){
                console.log("Warning: trying to set range (" + rLower + "," + rUpper + ") which is outside of bounds (" + rangeMin + "," + rangeMax + "). ");
                rLower = rangeMax - dif;
                rUpper = rangeMax;
            }

            setRange(rLower, rUpper);
        }

        return {begin: sliderRange.begin, end: sliderRange.end};
    }

    function togglePlayButton () {
        if (playing) {
            stopPlaying();
        } else {
            startPlaying();
        }
    }

    function frameTick() {
        if (!playing) {
            return;
        }

        var limitWidth = rangeMax - rangeMin + 1;
        var rangeWidth = sliderRange.end - sliderRange.begin + 1;
        var delta = Math.min(Math.ceil(rangeWidth / 10), Math.ceil(limitWidth / 100));

        // Check if playback has reached the end
        if (sliderRange.end + delta > rangeMax) {
            delta = rangeMax - sliderRange.end;
            stopPlaying();
        }

        setRange(sliderRange.begin + delta, sliderRange.end + delta);

        setTimeout(frameTick, playingRate);
    }

    function startPlaying(rate) {
        if (rate !== undefined) {
            playingRate = rate;
        }

        if (playing) {
            return;
        }

        playing = true;
        if (playButton) {
            playSymbol.style("visibility", "hidden");
            stopSymbol.style("visibility", "visible");
        }
        frameTick();
    }

    function stopPlaying() {
        playing = false;
        if (playButton) {
            playSymbol.style("visibility", "visible");
            stopSymbol.style("visibility", "hidden");
        }
    }

    setRange(sliderRange.begin, sliderRange.end);

    return {
        range: range,
        startPlaying: startPlaying,
        stopPlaying: stopPlaying,
        onChange: onChange,
        onTouchEnd: onTouchEnd,
        updateUIFromRange: updateUIFromRange
    };
}

