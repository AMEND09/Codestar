const fs = require('fs');
const css = `
.path-item { position: relative; }
.lesson-popover {
  position: absolute;
  top: auto;
  bottom: 85px; /* Sits cleanly above the node */
  left: 50%;
  transform: translateX(-50%);
  background: #58cc02;
  border-radius: 16px;
  padding: 16px 20px 20px 20px;
  width: 290px;
  color: white;
  z-index: 100;
  animation: popin 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards;
  pointer-events: none;
}

@keyframes popin {
  0% { opacity: 0; transform: translateX(-50%) scale(0.6) translateY(20px); }
  100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
}

.popover-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  pointer-events: auto;
}

.popover-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.3;
}

.popover-concept {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  opacity: 1;
  padding-bottom: 8px;
}

.lesson-popover .start-btn {
  display: block;
  background: white;
  color: #58cc02;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 0 #e5e5e5;
  padding: 14px 16px;
  font-weight: 800;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.lesson-popover .start-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 #e5e5e5;
  margin-bottom: 4px;
}

.popover-arrow {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 15px solid #58cc02;
}
`;
fs.appendFileSync('src/App.css', css);
