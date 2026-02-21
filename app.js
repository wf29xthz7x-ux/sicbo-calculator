'use strict';

const state = {
  totalBalance: 0,
  betAmount: 0,
  selectedBet: '大',
  currentDice: [],
  hasRollRight: false,
  stats: {
    totalBets: 0,
    totalWagered: 0,
    wins: 0,
    losses: 0
  }
};

const DOM = {
  balanceDisplay: document.getElementById('balanceDisplay'),
  currentAmount: document.getElementById('currentAmount'),
  betButtons: document.querySelectorAll('#betOptions .bet-btn:not(.roll-btn)'),
  btnRoll: document.getElementById('btn-roll'),
  diceSlots: [document.getElementById('dice-0'), document.getElementById('dice-1'), document.getElementById('dice-2')],
  btnSubmit: document.getElementById('btnSubmit'),
  historyList: document.getElementById('historyList'),
  stats: {
    count: document.getElementById('stat-count'),
    wager: document.getElementById('stat-wager'),
    winrate: document.getElementById('stat-winrate'),
    win: document.getElementById('stat-win'),
    lose: document.getElementById('stat-lose'),
    roi: document.getElementById('stat-roi')
  }
};

function init() {
  DOM.betButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.selectedBet = e.target.dataset.type;
      DOM.betButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  DOM.btnRoll.addEventListener('click', () => {
    state.hasRollRight = !state.hasRollRight;
    DOM.btnRoll.classList.toggle('active', state.hasRollRight);
  });

  document.getElementById('amountBtns').addEventListener('click', (e) => {
    if (e.target.classList.contains('amt-btn')) {
      if (e.target.id === 'btnClear') {
        state.betAmount = 0;
      } else {
        state.betAmount += parseInt(e.target.dataset.val, 10);
      }
      DOM.currentAmount.innerText = state.betAmount;
    }
  });

  document.getElementById('diceKeypad').addEventListener('click', (e) => {
    if (e.target.dataset.num) {
      handleDiceInput(parseInt(e.target.dataset.num, 10));
    } else if (e.target.id === 'btnDeleteDice') {
      handleDiceDelete();
    } else if (e.target.id === 'btnSubmit') {
      calculateResult();
    }
  });

  DOM.historyList.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-btn');
    if (btn) {
      removeRecord(btn);
    }
  });
}

function handleDiceInput(num) {
  if (state.currentDice.length < 3) {
    state.currentDice.push(num);
    updateDiceUI();
  }
}

function handleDiceDelete() {
  if (state.currentDice.length > 0) {
    state.currentDice.pop();
    updateDiceUI();
  }
}

function updateDiceUI() {
  for (let i = 0; i < 3; i++) {
    const slot = DOM.diceSlots[i];
    if (state.currentDice[i] !== undefined) {
      slot.innerText = state.currentDice[i];
      slot.classList.add('filled');
    } else {
      slot.innerText = '';
      slot.classList.remove('filled');
    }
  }
  DOM.btnSubmit.disabled = state.currentDice.length !== 3;
}

function calculateResult() {
  if (state.betAmount <= 0) return;
  if (state.currentDice.length !== 3) return;

  const [d1, d2, d3] = state.currentDice;
  const sum = d1 + d2 + d3;
  const isTriple = (d1 === d2 && d2 === d3);
  
  let actualResultStr = isTriple ? '圍骰' : (sum <= 10 ? '細' : '大');
  let profitLoss = 0;
  let isWin = false;

  if (actualResultStr === '圍骰') {
    if (state.selectedBet === '圍骰') {
      isWin = true;
      profitLoss = state.betAmount * 24;
    } else {
      isWin = false;
      profitLoss = -state.betAmount;
    }
  } else {
    if (state.selectedBet === actualResultStr) {
      isWin = true;
      profitLoss = state.betAmount * 1;
    } else {
      isWin = false;
      profitLoss = -state.betAmount;
    }
  }

  updateStateAfterRound(profitLoss, state.betAmount, isWin);

  const diceDisplayStr = `[${d1}, ${d2}, ${d3}] 共 ${sum} 點`;
  renderHistoryItem(state.selectedBet, state.betAmount, actualResultStr, diceDisplayStr, profitLoss, isWin, state.hasRollRight);

  resetRoundState();
}

function updateStateAfterRound(profit, wager, isWin) {
  state.totalBalance += profit;
  state.stats.totalBets += 1;
  state.stats.totalWagered += wager;
  if (isWin) state.stats.wins += 1;
  else state.stats.losses += 1;
  
  updateGlobalUI();
  triggerBalanceAnimation();
}

function resetRoundState() {
  state.currentDice = [];
  state.hasRollRight = false;
  DOM.btnRoll.classList.remove('active');
  updateDiceUI();
}

function triggerBalanceAnimation() {
  DOM.balanceDisplay.classList.remove('pulse-anim');
  void DOM.balanceDisplay.offsetWidth; 
  DOM.balanceDisplay.classList.add('pulse-anim');
}

function updateGlobalUI() {
  DOM.balanceDisplay.innerText = (state.totalBalance > 0 ? '+$' : (state.totalBalance < 0 ? '-$' : '$')) + Math.abs(state.totalBalance);
  DOM.balanceDisplay.className = 'balance-amount ' + (state.totalBalance > 0 ? 'positive' : (state.totalBalance < 0 ? 'negative' : 'neutral'));

  DOM.stats.count.innerText = state.stats.totalBets;
  DOM.stats.wager.innerText = '$' + state.stats.totalWagered;
  
  const winRate = state.stats.totalBets > 0 ? ((state.stats.wins / state.stats.totalBets) * 100).toFixed(1) : 0;
  DOM.stats.winrate.innerText = winRate + '%';
  DOM.stats.win.innerText = state.stats.wins;
  DOM.stats.lose.innerText = state.stats.losses;
  
  const roi = state.stats.totalWagered > 0 ? ((state.totalBalance / state.stats.totalWagered) * 100).toFixed(1) : 0;
  DOM.stats.roi.innerText = (roi > 0 ? '+' : '') + roi + '%';
  DOM.stats.roi.className = 'stat-value ' + (roi > 0 ? 'win-text' : (roi < 0 ? 'lose-text' : ''));
}

function renderHistoryItem(betType, amount, actualResult, diceStr, profitLoss, isWin, hasRollRightStatus) {
  const emptyMsg = document.getElementById('emptyMsg');
  if (emptyMsg) emptyMsg.remove();

  const time = new Date().toLocaleTimeString('zh-HK', { hour12: false, hour: '2-digit', minute:'2-digit' });
  const rollBadgeHTML = hasRollRightStatus ? `<span class="roll-badge">擲骰權</span>` : '';
  
  const item = document.createElement('div');
  item.className = 'history-item';
  item.dataset.amount = amount;
  item.dataset.profit = profitLoss;
  item.dataset.iswin = isWin;

  // 重構結構：將左邊文字與右邊動作分開，方便在手機上堆疊
  item.innerHTML = `
    <div class="history-content">
      <div class="hist-top">${time} | 投注 <b>${betType}</b> ($${amount}) ${rollBadgeHTML}</div>
      <div class="hist-bottom">${diceStr} <b>${actualResult}</b></div>
    </div>
    <div class="history-action">
      <div class="profit-text ${isWin ? 'positive' : 'negative'}">
        ${isWin ? '+' : '-'}$${Math.abs(profitLoss)}<br>
        <span class="profit-label">${isWin ? 'WIN' : 'LOSS'}</span>
      </div>
      <button class="delete-btn" title="刪除">✖</button>
    </div>
  `;

  DOM.historyList.prepend(item);
}

function removeRecord(btnElement) {
  // 補回：刪除前再次確認機制
  if (!confirm("確定要刪除這筆紀錄嗎？統計數據將會自動重算。")) {
    return;
  }

  const item = btnElement.closest('.history-item');
  const amount = parseInt(item.dataset.amount, 10);
  const profitLoss = parseInt(item.dataset.profit, 10);
  const isWin = item.dataset.iswin === 'true';

  state.totalBalance -= profitLoss;
  state.stats.totalBets -= 1;
  state.stats.totalWagered -= amount;
  if (isWin) state.stats.wins -= 1;
  else state.stats.losses -= 1;

  updateGlobalUI();
  triggerBalanceAnimation();
  item.remove();

  if (DOM.historyList.children.length === 0) {
    DOM.historyList.innerHTML = '<div id="emptyMsg" class="empty-msg">目前尚無紀錄</div>';
  }
}

document.addEventListener('DOMContentLoaded', init);