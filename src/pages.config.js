import ElasticsearchConfig from './pages/ElasticsearchConfig';
import PersonasLibrary from './pages/PersonasLibrary';
import Templates from './pages/Templates';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ElasticsearchConfig": ElasticsearchConfig,
    "PersonasLibrary": PersonasLibrary,
    "Templates": Templates,
}

export const pagesConfig = {
    mainPage: "PersonasLibrary",
    Pages: PAGES,
    Layout: __Layout,
};