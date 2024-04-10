let heightMap; // To store water height at each point
let flowMap; // To store flow vector at each point (x, y components)
let terrainMap;
let cols, rows;
let paintingMode = "water"; // Default to painting water
let modeButton;
let resolution = 5; // Lower resolution means more detail


function setup() {
  createCanvas(400, 400);
  cols = width / resolution;
  rows = height / resolution;

  heightMap = new Array(cols);
  flowMap = new Array(cols);
  terrainMap = new Array(cols);

  let noiseScale = 0.1; // Adjust for more or less detailed terrain features

  for (let i = 0; i < cols; i++) {
    heightMap[i] = new Array(rows);
    flowMap[i] = new Array(rows);
    terrainMap[i] = new Array(rows);
    for (let j = 0; j < rows; j++) {
      heightMap[i][j] = 0; // Initialize water height to 0
      flowMap[i][j] = createVector(0, 0); // Initialize flow vector to (0,0)
      // Generate terrain height using Perlin noise
      let noiseVal = noise(i * noiseScale, j * noiseScale);
      terrainMap[i][j] = map(noiseVal, 0, 1, 0, 255); // Map noise value to possible terrain height
    }
  }

  modeButton = createButton('Switch to Water');
  modeButton.position(10, height + 5); // Adjust button position as needed
  modeButton.mousePressed(toggleMode);
}

function calculateFlowOld() {
  let newFlowMap = new Array(cols)
    .fill()
    .map(() => new Array(rows).fill().map(() => createVector(0, 0)));
  let dampingFactor = 0.7; // Damping to reduce the intensity of flow each step
  let momentumFactor = 0.9; // Factor to retain some of the previous flow for momentum

  for (let x = 1; x < cols - 1; x++) {
    for (let y = 1; y < rows - 1; y++) {
      // Incorporate terrain into the current height for more accurate flow calculation
      let currentTotalHeight = heightMap[x][y] + terrainMap[x][y];
      let totalFlow = createVector(0, 0);

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue; // Skip the current cell

          let neighborHeight = heightMap[x + i][y + j] + terrainMap[x + i][y + j];
          let heightDifference = currentTotalHeight - neighborHeight;
          if (heightDifference > 0) {
            // Calculate flow based on height difference, taking terrain into account
            let flowAmount = heightDifference * 0.5; // Simplified flow calculation
            totalFlow.add(createVector(i * flowAmount, j * flowAmount));
          }
        }
      }

      // Apply damping and momentum to the total flow vector
      totalFlow.mult(dampingFactor).add(p5.Vector.mult(flowMap[x][y], momentumFactor));
      newFlowMap[x][y] = totalFlow;
    }
  }

  // Update the global flowMap with the newly calculated flows
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      flowMap[x][y] = newFlowMap[x][y];
      // Clamp the flow magnitude to ensure it doesn't exceed a realistic maximum
      flowMap[x][y].setMag(constrain(flowMap[x][y].mag(), 0, 5));
    }
  }
}

function calculateFlowOld2() {
  let newFlowMap = new Array(cols)
    .fill()
    .map(() => new Array(rows).fill().map(() => createVector(0, 0)));

  for (let x = 1; x < cols - 1; x++) {
    for (let y = 1; y < rows - 1; y++) {
      let currentTotalHeight = heightMap[x][y] + terrainMap[x][y];
      let totalFlow = createVector(0, 0);

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;

          let neighborHeight = heightMap[x + i][y + j] + terrainMap[x + i][y + j];
          let heightDifference = currentTotalHeight - neighborHeight;
          if (heightDifference > 0) {
            let flowVector = createVector(i, j);
            let flowAmount = (heightDifference * flowRate) * (heightMap[x][y] / 255); // Example volume-based flow calculation
            totalFlow.add(flowVector.setMag(flowAmount));
          }
        }
      }

      // Incorporate previous flow for momentum
      let previousFlow = p5.Vector.mult(flowMap[x][y], momentumFactor);
      // Apply damping
      totalFlow.add(previousFlow).mult(dampingFactor);
      
      newFlowMap[x][y] = totalFlow.limit(20); // Ensure the flow does not exceed a maximum magnitude
    }
  }

  // Update global flowMap
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      flowMap[x][y] = newFlowMap[x][y];
    }
  }
}

function calculateFlow() {
  let newFlowMap = new Array(cols)
    .fill()
    .map(() => new Array(rows).fill().map(() => createVector(0, 0)));
  let dampingFactor = 0.6; // Damping to reduce the intensity of flow each step
  let momentumFactor = 0.6; // Factor to retain some of the previous flow for momentum
  let flowRate = 0.9; // Controls the rate of flow based on height difference

  for (let x = 1; x < cols - 1; x++) {
    for (let y = 1; y < rows - 1; y++) {
      let currentTotalHeight = heightMap[x][y] + terrainMap[x][y];
      let totalFlow = createVector(0, 0);

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;

          let neighborHeight = heightMap[x + i][y + j] + terrainMap[x + i][y + j];
          let heightDifference = currentTotalHeight - neighborHeight;
          if (heightDifference > 0) {
            // Adjust the flow calculation to factor in momentum based on height difference
            let flowVector = createVector(i, j);
            let baseFlowAmount = heightDifference * flowRate; // Base flow calculation
            let momentumBoost = heightDifference * momentumFactor; // Increase flow with height difference
            let flowAmount = baseFlowAmount + momentumBoost;
            totalFlow.add(flowVector.setMag(flowAmount));
          }
        }
      }

      // Incorporate previous flow for momentum, applying damping
      let previousFlow = p5.Vector.mult(flowMap[x][y], momentumFactor);
      totalFlow.add(previousFlow).mult(dampingFactor);
      
      newFlowMap[x][y] = totalFlow.limit(50); // Ensure the flow does not exceed a maximum magnitude
    }
  }

  // Update the global flowMap
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      flowMap[x][y] = newFlowMap[x][y];
    }
  }
}

function updateHeightMap() {
  let maxChange = 50; // Limiting the max water height change per frame to stabilize simulation
  let newHeightMap = new Array(cols).fill().map(() => new Array(rows).fill(0));

  // First, calculate the potential new heights based on flow
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let flow = flowMap[x][y];
      if (flow.mag() === 0) continue; // Skip if no flow

      let newX = constrain(x + Math.sign(flow.x), 0, cols - 1);
      let newY = constrain(y + Math.sign(flow.y), 0, rows - 1);

      let flowMagnitude = flow.mag();
      // Constrain the amount to move to ensure it's within the max change and doesn't exceed current height
      let amountToMove = constrain(min(flowMagnitude * 0.1, maxChange), 0, heightMap[x][y]);

      newHeightMap[x][y] -= amountToMove;
      newHeightMap[newX][newY] += amountToMove;
    }
  }

  // Apply the height changes, ensuring total water volume is conserved
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      heightMap[x][y] += newHeightMap[x][y];
      // Ensure the heightMap value stays within valid bounds
      heightMap[x][y] = constrain(heightMap[x][y], 0, 255);
    }
  }
}

function paint() {
  if (mouseIsPressed) {
    let gridX = Math.floor(mouseX / resolution);
    let gridY = Math.floor(mouseY / resolution);
    let radius = 10; // Radius of influence

    for (let x = max(0, gridX - radius); x <= min(cols - 1, gridX + radius); x++) {
      for (let y = max(0, gridY - radius); y <= min(rows - 1, gridY + radius); y++) {
        if (dist(x, y, gridX, gridY) <= radius) {
          if (paintingMode === "water") {
            // Paint water
            heightMap[x][y] = constrain(heightMap[x][y] + 10, 0, 255);
          } else if (paintingMode === "terrain") {
            // Paint terrain
            terrainMap[x][y] = constrain(terrainMap[x][y] + 10, 0, 255);
          }
        }
      }
    }
  }
}

function renderScene() {
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      // Render terrain
      let terrainHeight = terrainMap[x][y];
      // Terrain colors: gray to black (higher terrain is darker)
      let terrainColorValue = map(terrainHeight, 0, 255, 180, 0);
      fill(terrainColorValue);
      noStroke();
      rect(x * resolution, y * resolution, resolution, resolution);
      
      // Overlay water on top of the terrain with transparency
      let waterDepth = heightMap[x][y];
      if (waterDepth > 0) {
        // Water colors: light blue to deep blue (deeper water is darker)
        let waterColorValue = map(waterDepth, 0, 255, 150, 0); // Mapping to blue values
        // Adjust alpha based on water depth for visual effect, more depth = less transparent
        let alphaValue = map(waterDepth, 0, 20, 150, 70); // Adjust these values as needed
        fill(0, 100, waterColorValue, alphaValue); // Add alpha value for transparency
        rect(x * resolution, y * resolution, resolution, resolution);
      }

      // Draw flow direction if significant flow is present
      let flow = flowMap[x][y];
      if (flow.mag() > 1) { // Only draw for significant flow
        stroke(0, 0, 255); // Flow line color, using blue to match water theme
        strokeWeight(1);
        line(
          x * resolution + resolution / 2,
          y * resolution + resolution / 2,
          (x + flow.x / 10) * resolution + resolution / 2, // Scale down for visual purposes
          (y + flow.y / 10) * resolution + resolution / 2
        );
      }
    }
  }
}

function renderSceneFlow() {
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      // Render terrain
      let terrainHeight = terrainMap[x][y];
      let terrainColorValue = map(terrainHeight, 0, 255, 0, 255); // Gray to black for terrain
      fill(terrainColorValue);
      noStroke();
      rect(x * resolution, y * resolution, resolution, resolution);
      
      // Overlay water with transparency
      let waterDepth = heightMap[x][y];
      if (waterDepth > 0) {
        let flow = flowMap[x][y];
        // Base water color
        let baseColor = color(100, 200, 255); // Light blue to deep blue for water
        // Adjust color based on flow magnitude
        let flowMagnitude = flow.mag();
        let brightnessAdjust = map(flowMagnitude, 0, 5, 0, 255); // Adjust max flow as needed
        let waterColor = lerpColor(color(100, 200, 255, 150), color(233, 251, brightnessAdjust, 150), flowMagnitude / 5);
        
        fill(waterColor);
        rect(x * resolution, y * resolution, resolution, resolution);
      }
    }
  }
}

function renderSceneFlow2() {
  colorMode(RGB); // Ensure color mode is set to RGB for consistent color blending
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      // Render terrain
      let terrainHeight = terrainMap[x][y];
      fill(map(terrainHeight, 0, 100, 0, 100)); // Gray to dark gray for terrain
      noStroke();
      rect(x * resolution, y * resolution, resolution, resolution);

      // Determine water depth
      let waterDepth = heightMap[x][y] - terrainHeight;
      if (waterDepth > 0) {
        // Set a base color for water
        fill(64, 164, 223, 128); // Semi-transparent blue
        rect(x * resolution, y * resolution, resolution, resolution);

        // Overlay darker layers based on water depth
        let depthLayers = min(floor(map(waterDepth, 0, 255, 1, 5)), 0); // Cap the number of layers to avoid excessive darkness
        for (let layer = 0; layer < depthLayers; layer++) {
          fill(64, 164, 223, 50); // Slightly more transparent for additional layers
          rect(x * resolution, y * resolution, resolution, resolution);
        }
      }
    }
  }
}

function renderSceneFlow3() {
  colorMode(RGB); // Ensure color mode is set to RGB
  noStroke(); // No outlines for rectangles

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      // Render terrain
      let terrainHeight = terrainMap[x][y];
      fill(map(terrainHeight, 20, 255, 20, 255)); // Terrain color from light to dark gray
      rect(x * resolution, y * resolution, resolution, resolution);

      // Water rendering with depth layering and flow visualization
      let waterDepth = heightMap[x][y] - terrainHeight;
      if (waterDepth > 0) {
        // Basic water color, more opaque for initial layer
        fill(64, 164, 255, 80); // Semi-transparent blue
        rect(x * resolution, y * resolution, resolution, resolution);

        // Enhanced depth layering
        let depthLayers = min(floor(map(waterDepth, 0, 255, 1, 8)), 1); // More layers for deeper water
        for (let layer = 1; layer < depthLayers; layer++) {
          // Increasing opacity with each layer, up to a point
          fill(64, 164, 255, 80 + layer * 15); // Darken with depth, adjust numbers as needed
          rect(x * resolution, y * resolution, resolution, resolution);
        }

        // Flow visualization
        let flow = flowMap[x][y];
        let flowMagnitude = flow.mag();
        if (flowMagnitude > 0.1) { // Threshold for visualizing flow
          // Blending in a lighter color to indicate flow, more noticeable with stronger flow
          let flowColorIntensity = map(flowMagnitude, 0, 5, 150, 255); // Adjust as needed
          fill(220, 255, 255, map(flowMagnitude, 0, 5, 50, 100)); // Cyan-ish color for flow
          rect(x * resolution, y * resolution, resolution, resolution);
        }
      }
    }
  }
}

function toggleMode() {
  if (paintingMode === "water") {
    paintingMode = "terrain";
    modeButton.html('Switch to Water');
  } else {
    paintingMode = "water";
    modeButton.html('Switch to Terrain');
  }
}

function draw() {
  background(255);
  calculateFlow();
  updateHeightMap();
  renderSceneFlow();
  paint();
}




