import { useCallback, useEffect, useState } from 'react'
import { getCellPosition, getCells, Grid, randomizeGrid, transformGrid } from '../utils'
import { COLUMNS, INTERVAL } from '../utils/constants'
import useInterval from 'use-interval'
import { ApiPromise, WsProvider } from "@polkadot/api";
import { ContractPromise } from "@polkadot/api-contract";

import { Keyring } from "@polkadot/keyring";
import util_crypto from "@polkadot/util-crypto";
import type { WeightV2 } from '@polkadot/types/interfaces'
import { BN, BN_ONE } from "@polkadot/util";
const MAX_CALL_WEIGHT = new BN(5_000_000_000_000).isub(BN_ONE);
const PROOFSIZE = new BN(1_000_000);

const useGame = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [steps, setSteps] = useState<number>(0)
  const [grid, setGrid] = useState<Grid>({})
  const [liveCellsPos, setLiveCellsPos] = useState<number[]>([])

  useEffect(() => {
    initialize()
  }, [])

  useInterval(
    () => {
      handleNext()
    },
    isRunning ? INTERVAL : null
  )

  const initialize = useCallback(() => {
    setSteps(0)
    const cells = getCells(COLUMNS)

    const half_columns = COLUMNS / 2;
    const half_rows = COLUMNS / 2;
    // Place a cross pattern at the center of the grid
    cells[half_columns][half_rows] = true
    cells[half_columns - 1][half_rows] = true
    cells[half_columns + 1][half_rows] = true
    cells[half_columns][half_rows - 1] = true
    cells[half_columns][half_rows + 1] = true

    setGrid(cells)
  }, [])

  const handleNext = useCallback(() => {
    const wsProvider = new WsProvider('wss://0adf-2a0d-3344-18-3b10-b849-40b2-1e09-ad33.eu.ngrok.io');
    const api = ApiPromise.create({
      provider: wsProvider,
    }).then(api => {
      const metadata = require("./mikasa.json");
      const address = "5HPhYELrkS96S7bG8wcTUdji869XJmc7za6MVd9ks5nse9so";
      const contract = new ContractPromise(api, metadata, address);

      const keyring = new Keyring({ type: 'sr25519' });

      const alicePair = keyring.addFromUri('//Alice', { name: 'Alice default' });

      // (We perform the send from an account, here using Alice's address)
      contract.query.get(
        alicePair.address,
        {
          gasLimit: api?.registry.createType('WeightV2', {
            refTime: MAX_CALL_WEIGHT,
            proofSize: PROOFSIZE,
          }) as WeightV2,
          storageDepositLimit: undefined,
        }
      ).then(obj => {
        // @ts-ignore: Object is possibly 'null'.
        setGrid(obj.output?.toJSON()["ok"])
      });

    });
  }, [grid, steps])

  const handleCell = useCallback((column: number, rowIndex: number, cell: boolean) => {
    const currentCell = !cell

    let newOb: any = { ...grid }
    newOb[column][rowIndex] = currentCell

    let cellPos = getCellPosition(grid, column, rowIndex)

    if (currentCell) {
      setLiveCellsPos([...liveCellsPos, cellPos])
    } else {
      let liveCellsToUpdate = [...liveCellsPos]
      const cellIndex = liveCellsToUpdate.indexOf(cellPos)
      if (cellIndex > -1) {
        liveCellsToUpdate.splice(cellIndex, 1)
      }

      setLiveCellsPos(liveCellsToUpdate)
    }
    setGrid(newOb)
  }, [grid, liveCellsPos])

  const randomize = useCallback(() => {
    setGrid(randomizeGrid(grid))
  }, [grid])

  return {
    grid,
    isRunning,
    steps,
    initialize,
    setIsRunning,
    randomize,
    handleCell,
    handleNext,
  }
}

export default useGame
