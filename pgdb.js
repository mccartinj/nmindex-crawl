import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({path: './.env'});

export const pool = new pg.Pool({
  user: process.env.PG_USER,
  database: process.env.PG_DB,
  password: process.env.PG_PW,
  port: process.env.PG_PORT,
  host: process.env.PG_HOST,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.PG_CACERT,
  }
});

export const getLinks = async () => {
  try {
    const res = await pool.query("SELECT link_url FROM links");
    return res.rows;
  } catch (error) {
    console.error(error);
  }
}

export const getLinksNotCrawled = async () => {
  try {
    const res = await pool.query("SELECT * FROM links WHERE crawled = false");
    return res.rows;
  } catch (error) {
    console.error(error);
  }
}


export const getGalaxyLinksNotCrawled = async () => {
  try {
    const res = await pool.query("SELECT * FROM links WHERE crawled = false AND nm_galaxy = true AND is_invalid = false LIMIT 100 ");
    return res.rows;
  } catch (error) {
    console.error(error);
  }
}

export const getEfluxLinksNotCrawled = async () => {
  try {
    const res = await pool.query("SELECT * FROM links WHERE crawled = false AND nm_galaxy = true AND link_domain = 'www.e-flux.com'");
    return res.rows;
  } catch (error) {
    console.error(error);
  }
}


export const getTargetedLinksNotCrawled = async () => {
  try {
    const res = await pool.query("SELECT * FROM links WHERE crawled = false AND nm_galaxy = true AND link_domain = 'www.guernicamag.com'");
    return res.rows;
  } catch (error) {
    console.error(error);
  }
}



export const saveLink = async (data) => {
	try {
		console.log('saveLink: '+data.link_url)
		const queryDef = {
	  		text: "INSERT INTO links (link_url,link_domain,link_source,crawled,nm_galaxy,nm_universe) VALUES ($1,$2,$3,$4,$5,$6);",
	  		values: [data.link_url,data.link_domain,data.link_source,data.crawled,data.nm_galaxy,data.nm_universe]
	  	}

		const res = await pool.query(queryDef);


	} catch(error) {
		console.log(error);
	}

}

export const getLinkData = async (url) => {
	  try {

	  	const queryDef = {
	  		text: "SELECT * FROM links WHERE link_url = $1",
	  		values: [url]
	  	}

	    const res = await pool.query(queryDef);
	  } catch (error) {
	    console.error(error);
	  }
}

export const setToCrawled = async (url) => {
	  try {

	  	const queryDef = {
	  		text: "UPDATE links SET crawled = true WHERE link_url = $1",
	  		values: [url]
	  	}

	    const res = await pool.query(queryDef);
	  } catch (error) {
	    console.error(error);
	  }
}




export const savePage = async (data) => {
	console.log('savePage')
	console.log(data.url);
	try {


		const queryDef = {
	  		text: "INSERT INTO pages (page_url, page_domain, title, description, body_text) VALUES ($1,$2,$3,$4,$5);",
	  		values: [data.url,data.domain,data.title,data.description,data.bodyText]
	  	}

		const res = await pool.query(queryDef);


	} catch(error) {
		console.log(error);
	}

}


export const addGalaxyDomain = async (data) => {
	try {
		console.log('addGalaxyDomain');
		console.log(data.link_url)
		const queryDef = {
	  		text: "INSERT INTO links (link_url,link_domain,crawled,nm_galaxy,nm_universe) VALUES ($1,$2,$3,$4,$5);",
	  		values: [data.link_url,data.link_domain,data.crawled,data.nm_galaxy,data.nm_universe]
	  	}

		const res = await pool.query(queryDef);


	} catch(error) {
		console.log(error);
	}

}

export const setToInvalid = async (url) => {
	  try {

	  	const queryDef = {
	  		text: "UPDATE links SET is_invalid = true WHERE link_url = $1",
	  		values: [url]
	  	}

	    const res = await pool.query(queryDef);
	  } catch (error) {
	    console.error(error);
	  }
}

export const setBatchToInvalid = async () => {
	try {
		const res = await pool.query("update links set is_invalid = true where link_url like any ('{%\#%,%\?%,%.pdf%,%.epub%,%.jpg%,%.jpeg%,%.png%,%.gif%,%mailto:%,%.mp4%,%.m4a%,%mp3%,%.wav%}');");
	} catch(error) {
		console.log(error)
	}
}

