import settings from '../config/settings';
import urljoin from '../lib/urljoin';
import * as api_status from './api.status';
import * as api_config from './api.config';
import * as api_file from './api.file';
import * as api_i18n from './api.i18n';
import * as api_connection from './api.connection';

const api = {
    status: api_status,
    config: api_config,
    file: api_file,
    i18n: api_i18n,
    connection: api_connection,
    addRoutes: (app) => {
        // status
        app.get(urljoin(settings.route, 'api/status'), api.status.currentStatus);

        // config
        app.get(urljoin(settings.route, 'api/config'), api.config.loadConfig);
        app.put(urljoin(settings.route, 'api/config'), api.config.saveConfig);

        // file
        app.post(urljoin(settings.route, 'api/file/upload'), api.file.uploadFile);

        // connection
        app.get(urljoin(settings.route, 'api/connection'), api.connection.listAllConnections);

        // i18n
        app.get(urljoin(settings.route, 'api/i18n/acceptedLng'), api.i18n.getAcceptedLanguage);
        app.post(urljoin(settings.route, 'api/i18n/sendMissing/:__lng__/:__ns__'), api.i18n.saveMissing);
    }
};

export default api;
