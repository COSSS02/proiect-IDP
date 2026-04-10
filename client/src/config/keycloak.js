import Keycloak from 'keycloak-js';

import keycloakConfig from './keycloak.json';

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;