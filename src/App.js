import { useState, useMemo } from "react";
import debounce from 'lodash.debounce';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Filter1Icon from '@mui/icons-material/Filter1';
import Filter2Icon from '@mui/icons-material/Filter2';
import Filter3Icon from '@mui/icons-material/Filter3';
import './App.css';

function App() {
  const [gamesOpts, setGamesOpts] = useState([]);
  const [gameValue, setGameValue] = useState(null);
  const [showGameData, setShowGameData] = useState(false);
  const [showLb, setShowLb] = useState(false);
  const [gameCats, setGameCats] = useState([]);
  const [category, setCategory] = useState('');
  const [topRunners, setTopRunners] = useState([]);
  const [topTimes, setTopTimes] = useState([]);

  function createData(place, runner, time) {
    return { place, runner, time };
  }

  const rows = [
    createData(<Filter1Icon style={{color: "#AF9500"}} />, topRunners[0], topTimes[0]),
    createData(<Filter2Icon style={{color: "#B4B4B4"}} />, topRunners[1], topTimes[1]),
    createData(<Filter3Icon style={{color: "#AD8A56"}} />, topRunners[2], topTimes[2])
  ]
  
  const onGameSelect = (event, newValue) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      return;
    }
    if (newValue !== null) {
      setGameValue(newValue);
      fetch(`https://www.speedrun.com/api/v1/games/${newValue.id}/categories`)
      .then(response => response.json())
      .then(data => {
        let tempData = data.data;
        let filterTempData = [];
        filterTempData = tempData.filter((value, index, array) => {
          return (value.type === 'per-game' && value.miscellaneous === false);
        });
        // console.log('cats', filterTempData);
        setGameCats(filterTempData);
        setShowGameData(true);
        setShowLb(false);
      });
    }
  }

  const onGameInputChange = (event, value, reason) => {
    if (value && (value.length > 2)) {
      fetch(`https://www.speedrun.com/api/v1/games?name=${value}`)
      .then(response => response.json())
      .then(data => {
        // console.log(data);
        const updatedOptions = data.data.map((d) => {
          return { label: d.names.international + " (" + d.released + ")", id: d.id };
        });
        setGamesOpts(updatedOptions);
      });
    } else {
      setGamesOpts([]);
    }
  }

  const handleCategory = (event, newValue) => {
    setCategory(newValue);
    fetch(`https://www.speedrun.com/api/v1/leaderboards/${gameValue.id}/category/${newValue}?top=3`)
    .then(response => response.json())
    .then(data => {
      // console.log('lb', data);
      let times = [];
      let runners = [];
      let promises = [];
      data.data.runs.forEach(run => {
        promises.push(fetch(`https://www.speedrun.com/api/v1/users/${run.run.players[0].id}`).then(res => { return res.json() }));
        times.push(convertTime(run.run.times.primary_t));
      });
      Promise.all(promises)
      .then(r => {
        // console.log(r);
        r.forEach(runner => {
          runners.push(runner.data.names.international);
        });
        setTopRunners(runners);
        setTopTimes(times);
        setShowLb(true);
      });
    });
  }

  const convertTime = (seconds) => {
    seconds = Math.round(seconds);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  }

  const debouncedOnGameInputChange = useMemo(() => debounce(onGameInputChange, 300), []);

  // console.log(gameValue);

  return (
    <Container>
      <h1>Go Fast!</h1>
      <Autocomplete 
        id="games-id"
        value={gameValue}
        onChange={onGameSelect}
        options={gamesOpts}
        onInputChange={debouncedOnGameInputChange}
        freeSolo
        sx={{ width: 600 }}
        renderInput={(params) => <TextField {...params} label="Search a Game..." />}
      />
      {showGameData && 
        <div>
          <h2>{gameValue !== null ? gameValue.label : ''}</h2>
          <ToggleButtonGroup
            color="primary"
            exclusive
            value={category}
            onChange={handleCategory}
          >
            {
              gameCats &&
              gameCats.map((g, i) => {
                return <ToggleButton value={g.id} key={i}>{g.name}</ToggleButton>
              })
            }
          </ToggleButtonGroup>
        </div>
      }
      {showLb &&
        <TableContainer style={{width: 450, marginTop: 20}} component={Paper}>
          <Table style={{ width: 450 }}>
            <TableHead>
              <TableRow>
                <TableCell>Place</TableCell>
                <TableCell align="right">Runner</TableCell>
                <TableCell align="right">Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {
                rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell component="th" scope="row">
                      {row.place}
                    </TableCell>
                    <TableCell align="right">{row.runner}</TableCell>
                    <TableCell align="right">{row.time}</TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
      }
    </Container>
  );
}

export default App;