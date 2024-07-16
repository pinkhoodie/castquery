WITH RelevantCasts AS (
    SELECT DISTINCT ON (c.fid, c.hash)
        c.fid,
        f.fname,
        c.text,
        c.timestamp,
        c.hash AS cast_hash
    FROM casts c
    JOIN fnames f ON c.fid = f.fid AND f.deleted_at IS NULL
    WHERE
        -- Neynar SQL queries time out at 10 minutes unless one term is used as a time. So each term must be run, and then the CSV downloaded, and stitched together to create the master CSV for Claude API parallelization
        -- The term here must match the term below
        (c.text ILIKE '% AI %'
        /* 
        OR c.text ILIKE '%A.I.%' 
        OR c.text ILIKE '%AGI%' 
        OR c.text ILIKE '%Artificial Intelligence%' 
        OR c.text ILIKE '%Artificial General Intelligence%' 
        OR c.text ILIKE '%Machine Learning%' 
        OR c.text ILIKE '%GPT%' 
        OR c.text ILIKE '%Deep Learning%' 
        OR c.text ILIKE '%Neural Networks%' 
        OR c.text ILIKE '%Natural Language Processing%' 
        OR c.text ILIKE '%Computer Vision%' 
        OR c.text ILIKE '%Big Data%' 
        OR c.text ILIKE '%Data Mining%' \
        OR c.text ILIKE '%Predictive Analytics%' 
        OR c.text ILIKE '%Cognitive Computing%' 
        OR c.text ILIKE '%Foundational Model%' 
        OR c.text ILIKE '%Reinforcement Learning%' 
        OR c.text ILIKE '%OpenAI%' 
        OR c.text ILIKE '%ChatGPT%' 
        OR c.text ILIKE '%DALL-E%' 
        OR c.text ILIKE '%Nvidia%' 
        OR c.text ILIKE '%Anthropic%' 
        OR c.text ILIKE '%Claude%' 
        OR c.text ILIKE '%Cohere%' 
        OR c.text ILIKE '%LLaMA%' 
        OR c.text ILIKE '%Hugging Face%'
        OR c.text ILIKE '%Foundational Model%'
        */
        ) 
        AND c.deleted_at IS NULL 
    ORDER BY c.fid, c.hash, c.timestamp
),
ReactionCounts AS (
    SELECT
        c.fid,
        c.hash,
        COUNT(DISTINCT r.id) AS reaction_count
    FROM casts c
    LEFT JOIN reactions r ON c.hash = r.target_hash AND r.deleted_at IS NULL
    WHERE
        (c.text ILIKE '% AI %'
        /* 
        OR c.text ILIKE '%A.I.%' 
        OR c.text ILIKE '%AGI%' 
        OR c.text ILIKE '%Artificial Intelligence%' 
        OR c.text ILIKE '%Artificial General Intelligence%' 
        OR c.text ILIKE '%Machine Learning%' 
        OR c.text ILIKE '%GPT%' 
        OR c.text ILIKE '%Deep Learning%' 
        OR c.text ILIKE '%Neural Networks%' 
        OR c.text ILIKE '%Natural Language Processing%' 
        OR c.text ILIKE '%Computer Vision%' 
        OR c.text ILIKE '%Big Data%' 
        OR c.text ILIKE '%Data Mining%' \
        OR c.text ILIKE '%Predictive Analytics%' 
        OR c.text ILIKE '%Cognitive Computing%' 
        OR c.text ILIKE '%Foundational Model%' 
        OR c.text ILIKE '%Reinforcement Learning%' 
        OR c.text ILIKE '%OpenAI%' 
        OR c.text ILIKE '%ChatGPT%' 
        OR c.text ILIKE '%DALL-E%' 
        OR c.text ILIKE '%Nvidia%' 
        OR c.text ILIKE '%Anthropic%' 
        OR c.text ILIKE '%Claude%' 
        OR c.text ILIKE '%Cohere%' 
        OR c.text ILIKE '%LLaMA%' 
        OR c.text ILIKE '%Hugging Face%'
        OR c.text ILIKE '%Foundational Model%'
        */
        ) 
        AND c.deleted_at IS NULL 
    GROUP BY c.fid, c.hash
),
UniqueCastsPerFid AS (
    SELECT
        fid,
        COUNT(*) AS unique_casts_count  -- Counting unique casts per fid
    FROM RelevantCasts
    GROUP BY fid
)
SELECT
    rc.fid,
    rc.fname,
    rc.text,
    rc.timestamp,
    rc.cast_hash,
    rct.reaction_count,
    ucf.unique_casts_count
FROM RelevantCasts rc
JOIN ReactionCounts rct ON rc.fid = rct.fid AND rc.cast_hash = rct.hash
JOIN UniqueCastsPerFid ucf ON rc.fid = ucf.fid
ORDER BY rct.reaction_count DESC, rc.timestamp DESC
