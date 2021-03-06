import { AddCharacterVariables, AddCharacter as NewCharacterResponse } from '../__generated__/AddCharacter';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import { GetCharacters_characters as Character, GetCharacters as CharactersResponse } from '../__generated__/GetCharacters';
import { IClientEnv } from '../server';
import { makeStyles, Theme } from '@material-ui/core';
import { RemoveCharacter, RemoveCharacterVariables } from '../__generated__/RemoveCharacter';
import { UpdateCharacter, UpdateCharacterVariables } from '../__generated__/UpdateCharacter';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import addCharacterMutation from '../queries/addCharacter.graphql';
import Button from '@material-ui/core/Button';
import CharacterScopeDialog from '../dialogs/CharacterScopeDialog';
import CharacterTile from '../components/CharacterTile';
import ConfirmDialog from '../dialogs/ConfirmDialog';
import getCharactersQuery from '../queries/getCharacters.graphql';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import Maybe from 'graphql/tsutils/Maybe';
import React, { useEffect } from 'react';
import removeCharacterMutation from '../queries/removeCharacter.graphql';
import Skeleton from '@material-ui/lab/Skeleton';
import updateCharacterMutation from '../queries/updateCharacter.graphql';
import useConfirmDialog from '../hooks/useConfirmDialog';
import withApollo from '../lib/withApollo';
import withWidth, { isWidthUp, WithWidthProps } from '@material-ui/core/withWidth';

const useStyles = makeStyles<Theme>(theme => ({
  content: {
    padding: theme.spacing(3),
  },
  scopes: {
    height: '200px',
    overflow: 'auto',
  },
}));

const getGridListCols = (width?: Breakpoint) => {
  if (width) {
    if (isWidthUp('xl', width)) {
      return 4;
    }

    if (isWidthUp('lg', width)) {
      return 3;
    }

    if (isWidthUp('md', width)) {
      return 2;
    }
  }

  return 1;
};

interface ICharactersPageProps extends WithWidthProps {
  env: IClientEnv;
}

export const Characters: React.FC<ICharactersPageProps> = ({ env, width }) => {
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();
  const { confirmDialogProps, showAlert } = useConfirmDialog();
  const [scopeDialogOpen, setScopeDialogOpen] = React.useState(false);
  const [currentCharacter, setCurrentCharacter] = React.useState<Maybe<Character>>(null);
  const router = useRouter();

  const [addCharacter, { loading: characterAddLoading }] = useMutation<NewCharacterResponse, AddCharacterVariables>(addCharacterMutation, {
    onError: error => {
      enqueueSnackbar(`Character update failed: ${error.message}`, { variant: 'error', autoHideDuration: 5000 });
    },
    onCompleted: data => {
      enqueueSnackbar(`Character '${data.addCharacter.name}' added successfully`, { variant: 'success', autoHideDuration: 5000 });
      router.push('/characters');
    },
    update(cache, { data }) {
      if (data) {
        const queryResponse = cache.readQuery<CharactersResponse>({
          query: getCharactersQuery,
        });

        if (queryResponse) {
          cache.writeQuery({
            query: getCharactersQuery,
            data: {
              characters: queryResponse.characters.concat([data.addCharacter]),
            },
          });
        }
      }
    },
  });

  const [updateCharacter, { loading: characterUpdateLoading }] = useMutation<UpdateCharacter, UpdateCharacterVariables>(updateCharacterMutation, {
    onError: error => {
      enqueueSnackbar(`Character update failed: ${error.message}`);
    },
    onCompleted: data => {
      enqueueSnackbar(`Character '${data.updateCharacter.name}' updated successfully`, { variant: 'success', autoHideDuration: 5000 });
      router.push('/characters');
    },
  });

  const [removeCharacter, { loading: characterRemovalLoading, error: characterRemovalError }] = useMutation<
    RemoveCharacter,
    RemoveCharacterVariables
  >(removeCharacterMutation);

  const { loading: charactersLoading, data, error } = useQuery<CharactersResponse>(getCharactersQuery);

  const { query } = router;

  useEffect(() => {
    if (query.code) {
      if (query.state) {
        const state = atob(query.state as string);
        const { id } = JSON.parse(state);
        updateCharacter({
          variables: {
            id: id,
            code: query.code as string,
          },
        });
      } else {
        addCharacter({
          variables: {
            code: query.code as string,
          },
        });
      }
    }
  }, [query.code]);

  const handleAddCharacterSubmit = (scopes?: string[]) => {
    setScopeDialogOpen(false);

    if (scopes && scopes.length) {
      const url = `${env.EVE_LOGIN_URL}/oauth/authorize?response_type=code&redirect_uri=${env.EVE_CHARACTER_REDIRECT_URL}&client_id=${
        env.EVE_CLIENT_ID
      }&scope=${scopes.join(' ')}`;
      window.location.href = url;
    }
  };

  const handleScopeDialogCancel = () => {
    setCurrentCharacter(null);
    setScopeDialogOpen(false);
  };

  const handleRemoveCharacter = (characterId: string, characterName: string) => {
    showAlert(`Remove '${characterName}'?`, `Character '${characterName}' will be removed and future updates disabled`, async confirm => {
      if (confirm) {
        removeCharacter({
          variables: {
            id: characterId,
          },
        });
      }
    });
  };

  const handleUpdateCharacter = (character: Character) => {
    setCurrentCharacter(character);
    setScopeDialogOpen(true);
  };

  const handleUpdateCharacterSubmit = (scopes?: string[]) => {
    const character = currentCharacter;
    setScopeDialogOpen(false);
    setCurrentCharacter(null);

    if (character) {
      if (scopes && scopes.length) {
        const state = btoa(JSON.stringify({ id: character.id }));
        const url = `${env.EVE_LOGIN_URL}/oauth/authorize?response_type=code&redirect_uri=${
          env.EVE_CHARACTER_REDIRECT_URL
        }&client_id=${env.EVE_CLIENT_ID}&scope=${scopes.join(' ')}&state=${state}`;
        window.location.href = url;
      } else {
        console.warn(`skipping ${character.name} update, no scopes were selected`);
      }
    }
  };

  const handleScopeDialogSubmit = currentCharacter ? handleUpdateCharacterSubmit : handleAddCharacterSubmit;

  const cellHeight = charactersLoading ? 120 : 'auto';

  return (
    <div className={classes.content}>
      <GridList cellHeight={cellHeight} cols={getGridListCols(width)} spacing={10}>
        {charactersLoading &&
          [0, 1, 2].map(i => (
            <GridListTile key={i}>
              <Skeleton variant="rect" height={cellHeight} />
            </GridListTile>
          ))}
        {data &&
          data.characters &&
          data.characters.map(character => (
            <GridListTile key={character.id}>
              <CharacterTile character={character} onRemove={handleRemoveCharacter} onUpdate={handleUpdateCharacter} />
            </GridListTile>
          ))}
        {characterAddLoading && (
          <GridListTile>
            <Skeleton variant="rect" height={cellHeight} />
          </GridListTile>
        )}
      </GridList>
      <Button color="primary" onClick={() => setScopeDialogOpen(true)}>
        Add Character
      </Button>
      <ConfirmDialog {...confirmDialogProps} />
      <CharacterScopeDialog
        open={scopeDialogOpen}
        onCancel={handleScopeDialogCancel}
        onSubmit={handleScopeDialogSubmit}
        scopes={currentCharacter ? currentCharacter.scopes : null}
      />
    </div>
  );
};

export default withWidth()(withApollo(Characters));
