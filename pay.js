(() => {
        // 從贊助按鈕帶來的金額（?amount=888）
        const AMOUNT = (new URLSearchParams(location.search).get("amount") || "").replace(/\D/g, "");
        const $ = (id) => document.getElementById(id);
        const el = {
          panel: $("panel"),
          stage: $("stage"),
          card: $("card"),
          front: $("front"),
          ring: $("ring"),
          brand: $("brand"),
          cardNumber: $("cardNumber"),
          cardName: $("cardName"),
          cardExp: $("cardExp"),
          cardCvv: $("cardCvv"),
          number: $("number"),
          holder: $("holder"),
          month: $("month"),
          year: $("year"),
          cvv: $("cvv"),
          form: $("payForm"),
          confirm: $("confirm"),
          status: $("status"),
        };

        /* ---------- 卡別偵測 ---------- */
        const TYPES = [
          {
            id: "visa",
            name: "VISA",
            re: /^4/,
            mask: "#### #### #### ####",
            cvv: 3,
            tint: "#4a7bff",
          },
          {
            id: "mc",
            name: "MASTERCARD",
            re: /^(5[1-5]|2[2-7])/,
            mask: "#### #### #### ####",
            cvv: 3,
            tint: "#ff8a4a",
          },
          {
            id: "amex",
            name: "AMEX",
            re: /^3[47]/,
            mask: "#### ###### #####",
            cvv: 4,
            tint: "#35c6a5",
          },
          {
            id: "jcb",
            name: "JCB",
            re: /^35/,
            mask: "#### #### #### ####",
            cvv: 3,
            tint: "#3dd17a",
          },
          {
            id: "union",
            name: "UNIONPAY",
            re: /^62/,
            mask: "#### #### #### ####",
            cvv: 3,
            tint: "#e0525e",
          },
        ];
        const DEFAULT_TYPE = {
          id: "none",
          name: "",
          mask: "#### #### #### ####",
          cvv: 3,
          tint: "transparent",
        };
        const detect = (digits) =>
          TYPES.find((t) => t.re.test(digits)) || DEFAULT_TYPE;

        const state = {
          digits: "",
          type: DEFAULT_TYPE,
          numberFocused: false,
          lastPop: -1,
        };

        /* ---------- 卡號格式化 ---------- */
        const groupDigits = (digits, mask) => {
          let out = "",
            i = 0;
          for (const ch of mask) {
            if (i >= digits.length) break;
            if (ch === " ") {
              out += " ";
              continue;
            }
            out += digits[i++];
          }
          return out.trim();
        };

        const renderNumber = () => {
          const { digits, type, numberFocused } = state;
          const frag = document.createDocumentFragment();
          let di = 0;
          for (const ch of type.mask) {
            const s = document.createElement("span");
            if (ch === " ") {
              s.textContent = " ";
              s.style.minWidth = ".5em";
              frag.appendChild(s);
              continue;
            }
            if (di < digits.length) {
              const hide =
                !numberFocused &&
                di >= 4 &&
                di < (type.id === "amex" ? 10 : 12);
              s.textContent = hide ? "＊" : digits[di];
              if (hide) s.textContent = "*";
              if (di === state.lastPop) s.className = "pop";
            } else {
              s.textContent = "#";
              s.className = "ph";
            }
            di++;
            frag.appendChild(s);
          }
          el.cardNumber.replaceChildren(frag);
          state.lastPop = -1;
        };

        const renderBrand = () => {
          const t = state.type;
          el.brand.textContent = t.name;
          el.brand.className =
            "brand" + (t.name ? " on" : "") + (t.id === "visa" ? " visa" : "");
          document.documentElement.style.setProperty("--card-tint", t.tint);
          el.cvv.maxLength = t.cvv;
          el.cvv.value = el.cvv.value.slice(0, t.cvv);
          renderCvv();
        };

        el.number.addEventListener("input", () => {
          const caret = el.number.selectionStart ?? el.number.value.length;
          const digitsBefore = el.number.value
            .slice(0, caret)
            .replace(/\D/g, "").length;
          const prevLen = state.digits.length;
          let digits = el.number.value.replace(/\D/g, "");
          const type = detect(digits);
          digits = digits.slice(0, type.mask.replace(/ /g, "").length);
          const typeChanged = type.id !== state.type.id;
          state.digits = digits;
          state.type = type;
          if (digits.length > prevLen) state.lastPop = digits.length - 1;
          const formatted = groupDigits(digits, type.mask);
          el.number.value = formatted;
          // 還原游標位置（以「游標前有幾個數字」為準）
          let pos = 0,
            count = 0;
          while (pos < formatted.length && count < digitsBefore) {
            if (formatted[pos] !== " ") count++;
            pos++;
          }
          try {
            el.number.setSelectionRange(pos, pos);
          } catch (_) {}
          if (typeChanged) renderBrand();
          renderNumber();
          clearErr("number");
        });

        /* ---------- 姓名 ---------- */
        el.holder.addEventListener("input", () => {
          const v = el.holder.value.trim();
          el.cardName.textContent = v || "FULL NAME";
          el.cardName.classList.toggle("ph", !v);
          clearErr("holder");
          requestAnimationFrame(positionRing);
        });

        /* ---------- 有效時間 ---------- */
        const now = new Date();
        const thisYear = now.getFullYear();
        const opt = (v, t) => {
          const o = document.createElement("option");
          o.value = v;
          o.textContent = t;
          return o;
        };
        const first = (t) => {
          const o = opt("", t);
          o.disabled = true;
          o.selected = true;
          o.hidden = true;
          return o;
        };
        el.month.append(first("月份"));
        for (let m = 1; m <= 12; m++)
          el.month.append(
            opt(String(m).padStart(2, "0"), String(m).padStart(2, "0")),
          );
        el.year.append(first("年份"));
        for (let y = thisYear; y <= thisYear + 11; y++)
          el.year.append(opt(String(y), String(y)));

        const renderExp = () => {
          const m = el.month.value,
            y = el.year.value;
          const txt = (m || "MM") + "/" + (y ? y.slice(2) : "YY");
          el.cardExp.textContent = txt;
          el.cardExp.classList.toggle("ph", !m && !y);
          requestAnimationFrame(positionRing);
        };
        [el.month, el.year].forEach((s) =>
          s.addEventListener("change", () => {
            s.classList.remove("empty");
            renderExp();
            clearErr("exp");
          }),
        );

        /* ---------- CVV ---------- */
        const renderCvv = () => {
          const n = el.cvv.value.length;
          el.cardCvv.textContent = n ? "•".repeat(n) : " ";
        };
        el.cvv.addEventListener("input", () => {
          el.cvv.value = el.cvv.value
            .replace(/\D/g, "")
            .slice(0, state.type.cvv);
          renderCvv();
          clearErr("cvv");
        });

        /* ---------- 聚焦高亮 + 翻面 ---------- */
        const targets = {
          number: () => el.cardNumber,
          holder: () => el.cardName,
          exp: () => el.cardExp,
        };
        let activeKey = null;

        const positionRing = () => {
          if (!activeKey || !targets[activeKey]) {
            el.ring.classList.remove("on");
            return;
          }
          const t = targets[activeKey]().getBoundingClientRect();
          const f = el.front.getBoundingClientRect();
          // 卡片翻面時 rect 會是鏡射，只在正面時計算
          if (el.card.classList.contains("flipped")) return;
          const pad = 6;
          const scaleX = el.front.offsetWidth / f.width || 1;
          const x = (t.left - f.left) * scaleX - pad;
          const y = (t.top - f.top) * scaleX - pad;
          el.ring.style.width = t.width * scaleX + pad * 2 + "px";
          el.ring.style.height = t.height * scaleX + pad * 2 + "px";
          el.ring.style.transform = `translate(${x}px, ${y}px)`;
          el.ring.classList.add("on");
        };

        const setActive = (key) => {
          activeKey = key;
          const flipped = key === "cvv";
          el.card.classList.toggle("flipped", flipped);
          if (flipped || !key) el.ring.classList.remove("on");
          else setTimeout(positionRing, flipped ? 0 : 20);
          if (!flipped && el.card.classList.contains("flipped") === false)
            positionRing();
        };

        const bindFocus = (node, key) => {
          node.addEventListener("focus", () => {
            if (key === "number") {
              state.numberFocused = true;
              renderNumber();
            }
            setActive(key);
            // 從背面翻回來需等動畫後再量位置
            setTimeout(positionRing, 360);
          });
          node.addEventListener("blur", () => {
            if (key === "number") {
              state.numberFocused = false;
              renderNumber();
            }
            setTimeout(() => {
              const a = document.activeElement;
              if (
                ![el.number, el.holder, el.month, el.year, el.cvv].includes(a)
              )
                setActive(null);
            }, 0);
          });
        };
        bindFocus(el.number, "number");
        bindFocus(el.holder, "holder");
        bindFocus(el.month, "exp");
        bindFocus(el.year, "exp");
        bindFocus(el.cvv, "cvv");
        window.addEventListener("resize", () => {
          syncCardHeight();
          positionRing();
        });

        /* 讓外框的上緣留白跟卡片高度同步 */
        const syncCardHeight = () => {
          el.panel.style.setProperty("--card-h", el.stage.offsetHeight + "px");
        };

        /* ---------- 必填欄位檢查 ---------- */
        const errorFields = {
          number: [el.number, $("numberErr")],
          holder: [el.holder, $("holderErr")],
          exp: [el.month, $("expErr")],
          cvv: [el.cvv, $("cvvErr")],
        };
        const setErr = (key, message) => {
          const field = errorFields[key];
          if (!field) return;
          const [input, messageEl] = field;
          input.setAttribute("aria-invalid", message ? "true" : "false");
          messageEl.textContent = message;
        };

        const clearErr = (key) => {
          setErr(key, "");
          el.status.textContent = "";
          el.status.className = "status";
          el.confirm.classList.remove("done");
          el.confirm.textContent = "確認";
        };

        const validate = () => {
          const numberValid = !!state.digits.length;
          const holderValid = !!el.holder.value.trim();
          const expValid = !!el.month.value && !!el.year.value;
          const cvvValid = !!el.cvv.value.trim();

          setErr("number", numberValid ? "" : "請填寫信用卡卡號。");
          setErr("holder", holderValid ? "" : "請輸入持卡者姓名。");
          setErr("exp", expValid ? "" : "請填寫有效時間。");
          setErr("cvv", cvvValid ? "" : "請填寫 CVV。");

          return numberValid && holderValid && expValid && cvvValid;
        };

        el.form.addEventListener("submit", (e) => {
          e.preventDefault();
          if (!validate()) {
            el.status.textContent = "請檢查標示的付款欄位。";
            el.status.className = "status err";
            return;
          }
          // TODO: 實際串接金流時，請改用金流商的 hosted fields / tokenization，
          // 不要把卡號與 CVV 直接送到自己的伺服器。
          el.confirm.classList.add("done");
          el.status.textContent = "";
          el.status.className = "status";
          setActive(null);
        });

        /* ---------- 初始化 ---------- */
        renderBrand();
        renderNumber();
        renderExp();
        syncCardHeight();
        if (document.fonts && document.fonts.ready)
          document.fonts.ready.then(() => {
            syncCardHeight();
            positionRing();
          });
      })();
