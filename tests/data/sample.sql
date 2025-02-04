--
-- PostgreSQL database dump
--

-- Dumped from database version 15.10 (Postgres.app)
-- Dumped by pg_dump version 17.2 (Postgres.app)


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--





--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE account (
    userId text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    providerAccountId text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


--
-- Name: authenticator; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE authenticator (
    credentialID text NOT NULL,
    userId text NOT NULL,
    providerAccountId text NOT NULL,
    credentialPublicKey text NOT NULL,
    counter integer NOT NULL,
    credentialDeviceType text NOT NULL,
    credentialBackedUp boolean NOT NULL,
    transports text
);


--
-- Name: collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE collections (
    collection_id character varying NOT NULL,
    start timestamp without time zone NOT NULL,
    complete timestamp without time zone,
    url character varying NOT NULL,
    status character varying NOT NULL,
    notes text,
    errors text,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE files (
    file_id character varying NOT NULL,
    file_name character varying,
    fiscal_year integer,
    approval_timestamp timestamp without time zone,
    folder character varying,
    approver_title character varying,
    funds_provided_by character varying,
    folder_id character varying,
    approver_title_id character varying,
    funds_provided_by_parsed character varying,
    excel_url character varying,
    pdf_url character varying,
    source_url character varying NOT NULL,
    source_data text,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now(),
    removed boolean DEFAULT false,
    source_text text
);


--
-- Name: footnotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE footnotes (
    file_id character varying NOT NULL,
    line_index integer NOT NULL,
    footnote_number character varying NOT NULL,
    footnote_text text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


--
-- Name: line_descriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE line_descriptions (
    line_number character varying NOT NULL,
    line_type_id character varying NOT NULL,
    description character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: line_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE line_types (
    line_type_id character varying NOT NULL,
    name character varying NOT NULL,
    lower_limit integer,
    upper_limit integer,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


--
-- Name: lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE lines (
    tafs_table_id character varying NOT NULL,
    line_index integer DEFAULT 0 NOT NULL,
    line_number character varying,
    line_split character varying,
    line_description character varying,
    approved_amount bigint,
    file_id character varying,
    line_type_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


--
-- Name: searches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE searches (
    id text NOT NULL,
    userId text NOT NULL,
    criterion json,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE session (
    sessionToken text NOT NULL,
    userId text NOT NULL,
    expires timestamp without time zone NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE subscriptions (
    id text NOT NULL,
    userId text NOT NULL,
    type character varying NOT NULL,
    itemId character varying NOT NULL,
    frequency character varying DEFAULT 'daily'::character varying NOT NULL,
    last_notified_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


--
-- Name: tafs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE tafs (
    file_id character varying NOT NULL,
    tafs_id character varying NOT NULL,
    iteration integer NOT NULL,
    fiscal_year integer NOT NULL,
    tafs_table_id character varying,
    cgac_agency character varying NOT NULL,
    cgac_acct character varying NOT NULL,
    allocation_agency_code character varying,
    allocation_subacct character varying,
    begin_poa integer,
    end_poa integer,
    account_id character varying NOT NULL,
    budget_agency_title character varying,
    budget_bureau_title character varying,
    account_title character varying,
    budget_agency_title_id character varying,
    budget_bureau_title_id character varying,
    account_title_id character varying,
    availability_type_code boolean,
    rpt_cat boolean,
    adj_aut boolean,
    iteration_description text,
    tafs_iteration_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now(),
    tafs_id_formatted character varying
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE user (
    id text NOT NULL,
    name text,
    email text,
    emailVerified timestamp without time zone,
    image text,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


--
-- Name: verificationToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE verificationToken (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp without time zone NOT NULL
);


--
-- Name: account account_provider_providerAccountId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY account
    ADD CONSTRAINT account_provider_providerAccountId_pk PRIMARY KEY (provider, providerAccountId);


--
-- Name: authenticator authenticator_credentialID_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY authenticator
    ADD CONSTRAINT authenticator_credentialID_unique UNIQUE (credentialID);


--
-- Name: authenticator authenticator_userId_credentialID_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY authenticator
    ADD CONSTRAINT authenticator_userId_credentialID_pk PRIMARY KEY (userId, credentialID);


--
-- Name: collections collections_complete_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY collections
    ADD CONSTRAINT collections_complete_unique UNIQUE (complete);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (collection_id);


--
-- Name: collections collections_start_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY collections
    ADD CONSTRAINT collections_start_unique UNIQUE (start);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY files
    ADD CONSTRAINT files_pkey PRIMARY KEY (file_id);


--
-- Name: footnotes footnotes_file_id_line_index_footnote_number_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY footnotes
    ADD CONSTRAINT footnotes_file_id_line_index_footnote_number_pk PRIMARY KEY (file_id, line_index, footnote_number);


--
-- Name: line_descriptions line_descriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY line_descriptions
    ADD CONSTRAINT line_descriptions_pkey PRIMARY KEY (line_number);


--
-- Name: line_types line_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY line_types
    ADD CONSTRAINT line_types_pkey PRIMARY KEY (line_type_id);


--
-- Name: lines lines_file_id_line_index_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY lines
    ADD CONSTRAINT lines_file_id_line_index_unique UNIQUE (file_id, line_index);


--
-- Name: lines lines_tafs_table_id_line_index_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY lines
    ADD CONSTRAINT lines_tafs_table_id_line_index_pk PRIMARY KEY (tafs_table_id, line_index);


--
-- Name: searches searches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY searches
    ADD CONSTRAINT searches_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sessionToken);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_userId_type_itemId_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY subscriptions
    ADD CONSTRAINT subscriptions_userId_type_itemId_unique UNIQUE NULLS NOT DISTINCT (userId, type, itemId);


--
-- Name: tafs tafs_file_id_tafs_id_iteration_fiscal_year_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY tafs
    ADD CONSTRAINT tafs_file_id_tafs_id_iteration_fiscal_year_pk PRIMARY KEY (file_id, tafs_id, iteration, fiscal_year);


--
-- Name: tafs tafs_tafs_table_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY tafs
    ADD CONSTRAINT tafs_tafs_table_id_unique UNIQUE (tafs_table_id);


--
-- Name: user user_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user
    ADD CONSTRAINT user_email_unique UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verificationToken verificationToken_identifier_token_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY verificationToken
    ADD CONSTRAINT verificationToken_identifier_token_pk PRIMARY KEY (identifier, token);


--
-- Name: co_complete_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX co_complete_index ON collections USING btree (complete);


--
-- Name: co_start_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX co_start_index ON collections USING btree (start);


--
-- Name: co_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX co_status_index ON collections USING btree (status);


--
-- Name: file_approval_timestamp_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_approval_timestamp_index ON files USING btree (approval_timestamp);


--
-- Name: file_approver_title_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_approver_title_id_index ON files USING btree (approver_title_id);


--
-- Name: file_approver_title_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_approver_title_index ON files USING btree (approver_title);


--
-- Name: file_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_created_at_index ON files USING btree (created_at);


--
-- Name: file_excel_url_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_excel_url_index ON files USING btree (excel_url);


--
-- Name: file_file_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_file_name_index ON files USING btree (file_name);


--
-- Name: file_fiscal_year_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_fiscal_year_index ON files USING btree (fiscal_year);


--
-- Name: file_folder_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_folder_id_index ON files USING btree (folder_id);


--
-- Name: file_folder_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_folder_index ON files USING btree (folder);


--
-- Name: file_funds_provided_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_funds_provided_by_index ON files USING btree (funds_provided_by);


--
-- Name: file_funds_provided_by_parsed_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_funds_provided_by_parsed_index ON files USING btree (funds_provided_by_parsed);


--
-- Name: file_modified_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_modified_at_index ON files USING btree (modified_at);


--
-- Name: file_pdf_url_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_pdf_url_index ON files USING btree (pdf_url);


--
-- Name: file_removed_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_removed_index ON files USING btree (removed);


--
-- Name: file_source_text_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_source_text_index ON files USING gin (source_text gin_trgm_ops);


--
-- Name: file_source_url_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX file_source_url_index ON files USING btree (source_url);


--
-- Name: fn_file_footnote_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fn_file_footnote_index ON footnotes USING btree (file_id, footnote_number);


--
-- Name: footnote_text_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX footnote_text_index ON footnotes USING gin (footnote_text gin_trgm_ops);


--
-- Name: line_approved_amount_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX line_approved_amount_index ON lines USING btree (approved_amount);


--
-- Name: line_description_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX line_description_index ON line_descriptions USING btree (description);


--
-- Name: line_line_description_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX line_line_description_index ON lines USING btree (line_description);


--
-- Name: line_line_number_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX line_line_number_index ON lines USING btree (line_number);


--
-- Name: line_line_split_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX line_line_split_index ON lines USING btree (line_split);


--
-- Name: line_type_lower_limit_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX line_type_lower_limit_index ON line_types USING btree (lower_limit);


--
-- Name: line_type_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX line_type_name_index ON line_types USING btree (name);


--
-- Name: line_type_upper_limit_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX line_type_upper_limit_index ON line_types USING btree (upper_limit);


--
-- Name: search_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_user_id_index ON searches USING btree (userId);


--
-- Name: subscription_frequency_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_frequency_index ON subscriptions USING btree (frequency);


--
-- Name: subscription_item_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_item_id_index ON subscriptions USING btree (itemId);


--
-- Name: subscription_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_type_index ON subscriptions USING btree (type);


--
-- Name: subscription_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_user_id_index ON subscriptions USING btree (userId);


--
-- Name: tafs_account_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_account_id_index ON tafs USING btree (account_id);


--
-- Name: tafs_account_title_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_account_title_id_index ON tafs USING btree (account_title_id);


--
-- Name: tafs_account_title_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_account_title_index ON tafs USING btree (account_title);


--
-- Name: tafs_adj_aut_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_adj_aut_index ON tafs USING btree (adj_aut);


--
-- Name: tafs_allocation_agency_code_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_allocation_agency_code_index ON tafs USING btree (allocation_agency_code);


--
-- Name: tafs_allocation_subacct_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_allocation_subacct_index ON tafs USING btree (allocation_subacct);


--
-- Name: tafs_budget_agency_title_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_budget_agency_title_id_index ON tafs USING btree (budget_agency_title_id);


--
-- Name: tafs_budget_agency_title_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_budget_agency_title_index ON tafs USING btree (budget_agency_title);


--
-- Name: tafs_budget_bureau_title_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_budget_bureau_title_id_index ON tafs USING btree (budget_bureau_title_id);


--
-- Name: tafs_budget_bureau_title_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_budget_bureau_title_index ON tafs USING btree (budget_bureau_title);


--
-- Name: tafs_cgac_acct_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_cgac_acct_index ON tafs USING btree (cgac_acct);


--
-- Name: tafs_cgac_agency_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_cgac_agency_index ON tafs USING btree (cgac_agency);


--
-- Name: tafs_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_created_at_index ON tafs USING btree (created_at);


--
-- Name: tafs_iteration_description_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_iteration_description_index ON tafs USING btree (iteration_description);


--
-- Name: tafs_modified_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_modified_at_index ON tafs USING btree (modified_at);


--
-- Name: tafs_rpt_cat_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_rpt_cat_index ON tafs USING btree (rpt_cat);


--
-- Name: tafs_tafs_id_formatted_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tafs_tafs_id_formatted_index ON tafs USING btree (tafs_id_formatted);


--
-- Name: account account_userId_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY account
    ADD CONSTRAINT account_userId_user_id_fk FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE;


--
-- Name: authenticator authenticator_userId_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY authenticator
    ADD CONSTRAINT authenticator_userId_user_id_fk FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE;


--
-- Name: footnotes footnotes_file_id_files_file_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY footnotes
    ADD CONSTRAINT footnotes_file_id_files_file_id_fk FOREIGN KEY (file_id) REFERENCES files(file_id);


--
-- Name: footnotes footnotes_file_id_line_index_lines_file_id_line_index_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY footnotes
    ADD CONSTRAINT footnotes_file_id_line_index_lines_file_id_line_index_fk FOREIGN KEY (file_id, line_index) REFERENCES lines(file_id, line_index);


--
-- Name: line_descriptions line_descriptions_line_type_id_line_types_line_type_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY line_descriptions
    ADD CONSTRAINT line_descriptions_line_type_id_line_types_line_type_id_fk FOREIGN KEY (line_type_id) REFERENCES line_types(line_type_id);


--
-- Name: lines lines_file_id_files_file_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY lines
    ADD CONSTRAINT lines_file_id_files_file_id_fk FOREIGN KEY (file_id) REFERENCES files(file_id);


--
-- Name: lines lines_line_type_id_line_types_line_type_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY lines
    ADD CONSTRAINT lines_line_type_id_line_types_line_type_id_fk FOREIGN KEY (line_type_id) REFERENCES line_types(line_type_id);


--
-- Name: lines lines_tafs_table_id_tafs_tafs_table_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY lines
    ADD CONSTRAINT lines_tafs_table_id_tafs_tafs_table_id_fk FOREIGN KEY (tafs_table_id) REFERENCES tafs(tafs_table_id);


--
-- Name: searches searches_userId_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY searches
    ADD CONSTRAINT searches_userId_user_id_fk FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE;


--
-- Name: session session_userId_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY session
    ADD CONSTRAINT session_userId_user_id_fk FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_userId_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY subscriptions
    ADD CONSTRAINT subscriptions_userId_user_id_fk FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE;


--
-- Name: tafs tafs_file_id_files_file_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY tafs
    ADD CONSTRAINT tafs_file_id_files_file_id_fk FOREIGN KEY (file_id) REFERENCES files(file_id);


--
-- PostgreSQL database dump complete
--


