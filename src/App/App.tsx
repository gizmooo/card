import React from 'react';
import './App.css';
import {CardBox} from '../CardBox/CardBox';

const cards = ['./card-0.jpg', './card-1.jpg', './card-0.jpg', './card-1.jpg'];

function App() {
  const cover = cards[Math.floor(cards.length * Math.random())];

  return (
    <div className="App">
      <CardBox onStateChange={(state) => {
        let consoleText = 'Нет такого стейта';
        switch (state) {
          case 0: {
            consoleText = 'Ничего не начато, ничего не загружено';
            break;
          }
          case 1: {
            consoleText = 'Все загружено, стартует анимация';
            break;
          }
          case 2: {
            consoleText = 'Стартовая анимация закончилась, ждем отрыва(туц-туц-туц)';
            break;
          }
          case 3: {
            consoleText = 'Отрыв произошел';
            break;
          }
          case 4: {
            consoleText = 'Анимация окончания закончилась, можно показывать 2D';
            break;
          }
        }
        console.log(consoleText);
      }}
               cover={cover}/>
    </div>
  );
}

export default App;
